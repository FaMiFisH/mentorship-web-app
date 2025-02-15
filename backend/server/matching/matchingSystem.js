//Process all matchable mentors and mentees
const pool = require('../db');


//Get all available mentors
const mentorQuery = "" +
"SELECT userid, name, businessarea, email, bio, menteeNum FROM " + 
"(SELECT userid, name, CASE WHEN menteeNum is null THEN 0 ELSE menteeNum END, businessarea, email, bio FROM users " + 
        "LEFT JOIN (SELECT COUNT(mentorid) menteeNum,  mentorid FROM mentoring GROUP BY mentorid) mentors " + 
        "ON userid = mentors.mentorid) mentoringCount " + 
            "JOIN mentor ON mentor.mentorid = mentoringCount.userid WHERE menteeNum < 5";

//Get a mentee based on their userid
const menteeQuery = "" + 
"SELECT userid, name, businessarea, email FROM " + 
"(SELECT userid, name, businessarea, email FROM users " +
"LEFT OUTER JOIN (SELECT COUNT(menteeID) num, menteeID FROM " +
    "mentoring GROUP BY menteeID HAVING COUNT(menteeID) < 10) mentees ON userid = mentees.menteeID) users WHERE userid = $1";

//Get all pairs of mentors and mentees with matching interests
const matchingInterestQuery = "" +
"SELECT menteeInterests.userid as menteeid, mentorInterests.userid as mentorid, menteeInterests.interest as commonInterest, menteeInterests.ordering as menteeRank, mentorInterests.ordering as mentorRank FROM " +  
"(SELECT mentees.userid, mentees.name, interest.interest, interest.ordering FROM " + 
"(SELECT userid, name FROM users join mentee on userid = menteeid) mentees " + 
    "JOIN interest " + 
    "ON mentees.userid = interest.userid AND interest.kind = 'mentee') menteeInterests " + 
        "JOIN (SELECT mentors.userid, mentors.name, interest.interest, interest.ordering FROM " + 
        "(SELECT userid, name FROM users JOIN mentor ON userid = mentorid) mentors " + 
            "JOIN interest " + 
            "ON mentors.userid = interest.userid AND interest.kind = 'mentor') mentorInterests " + 
        "ON menteeInterests.interest = mentorInterests.interest";

/*
Get all current pairs of mentors and their mentees (to avoid matching a mentee to a mentor they
are already being tutored by).
*/
const mentoringPairs = "" + 
"SELECT menteeid, mentorid FROM mentoring";

//For a particular user, get either their areas of expertise or the areas they wish to be
//tutored in
const userInterests = "SELECT interest, ordering FROM interest WHERE userid = $1 AND kind = $2";

//A queue of flags for mentees waiting to be matched by the system
const flagQueue = [];
//Stores flags of mentees currently being matched
let menteeFlags = [];

//The maximum number of mentees before the system must match any waiting mentees
const poolLimit = 10;
//The number of polls that can occur before the system must match any waiting mentees
const pollLimit = 3;
//Tracks the number of polls recorded since the last matching
let pollCount = 0;

// The maximum number of mentees a mentor can tutor
const maxMentees = 5;
/*
The maximum number of areas of expertise or areas to be tutored in that a mentor or 
mentee may have, respectively. These are referred to as "interests" generically
*/
const maxInterests = 5;
/*
The worst ranking a mentee can give to a mentor
(actually slightly worse due to how rankings are calculated)
*/
const worstRanking = maxInterests;

//For each menteeid, stores a map for the corresponding mentee which contains the 
//mentors already tutoring the mentee as key entries
let menteeMentorMap = new Map();

//A Tuple, structured (first, second)
class Tuple {
    constructor(first, second){
        this.first = first;
        this.second = second;
    }
    toString(){
        return "(" + this.first + ", " + this.second+ ")";
    }
    toJSON(){
        let jsonString = `{"first":"${this.first}","second":"${this.second}"}`;
        return jsonString;
    }
}

/*
The Flag class is used to determine whether the algorithm has finished with a 
particular mentee, using a status flag. The flag is 0 when the mentee is still 
being processed, 1 when the matching is complete and -1 when there has been an
error with the matching. The flag stores the mentee's userid and, when the 
matching on the mentee is complete, a list of mentors that the mentee has been
matched to

*/
class Flag { 
    constructor(menteeid){
        this.flag = 0;
        this.menteeid = menteeid;
        this.mentorList = [];
        this.err = null;
    }
    setFlag(val){
        this.flag = val;
    }
    getFlag(){
        return this.flag;
    }
    isFlagSet(){
        return this.flag != 0;
    }
    getMenteeID(){
        return this.menteeid;
    }
    setMentorList(mentorList){
        this.mentorList = mentorList;
    }
    getMentorList(){
        return this.mentorList;
    }
    setError(err){
        this.err = err;
    }
    getError(){
        return this.err;
    }
}


/* 
Stores information on a mentor or mentee.
The interestMap attribute is used to quickly retrieve an interest when 
checking for common interests between a mentee and mentor, e.g. to check whether.
*/
class User {
    constructor(userid, name, department, email, bio, interests){
        this.userid = userid;
        this.name = name;
        this.department = department;
        this.email = email;
        this.bio = bio;
        this.interests = interests;
        this.interestMap = new Map();
        if(interests != null){
            for(let i = 0; i < interests.length; ++i){
                this.interestMap.set(interests[i].second, null);
            }
        }
    }
    toString(){
        let str = "[";
        if (this.interests.length > 0){
            str += this.interests[0];
            for(let i = 1; i < this.interests.length; ++i){
                str +=  ", " + this.interests[i];
            }
        }
        str += "]";
        return "[" + this.userid + ", " + this.name + ", " + this.department + ", " + this.email + ", " + this.bio + ", " + str + "]";
    }
    toJSON(){
        let keys = Object.keys(this);
        let jsonString = "{";
        for(let i = 0; i < keys.length-3; ++i){
            jsonString += `"${keys[i]}":"${this[keys[i]]}",`;
        }

        jsonString +=`"interests": [`;
        let i = 0;
        for(i; i < this.interests.length-1; ++i){
            jsonString += this.interests[i].toJSON() + ",";
        }
        jsonString += this.interests[i].toJSON();

        jsonString += "]";
        jsonString += "}";
        
        return jsonString;
    }
}



class Mentee extends User{
   constructor(userid, name, department, email, bio, interests){
       super(userid, name, department, email, bio, interests);
       this.consideredMentors = new Map(); //Mentors already considered for this mentee by the algorithm
   }
}

class Mentor extends User{
    constructor(userid, name, department, email, bio, interests, menteeNum){
        super(userid, name, department, email, bio, interests);
        this.menteeNum = menteeNum; //The number of mentees a mentor is already tutoring
    }
}

/**
 * Get the interests of a mentee or mentor and return them as an array
 * @param {string} userid The userid of the user
 * @param {string} kind The type of user; either mentee or mentor
 * @throws {INterestsNotFoundError} Thrown if the user has no interests
 */

async function getInterests(userid, kind){
    let interests = undefined;
    try{
        interests = await pool.query(userInterests, [userid, kind]);
    } catch(err){
        throw err;
    }
    if(interests.rowCount === 0){
        throw {name: "InterestsNotFoundError", message: "Could not find user's interests"};
    }
    let interestArray = new Array();
    for(let j = 0; j < interests.rowCount; ++j){
        interestArray.push(new Tuple(interests.rows[j]["ordering"], interests.rows[j]["interest"]));
    }
    interestArray.sort((first, second) => { return first.first - second.first});
    return interestArray;
}
/**
 * Creates a Mentee object
 * @param  {string} menteeID The userid of the mentee 
 * @returns A Mentee object
 */
async function createMenteeObj(menteeID){
    let menteeResults = null;
    try{
        menteeResults = await pool.query(menteeQuery, [menteeID])
    } catch(err) {
        throw err;
    }
    
    let rows = menteeResults.rows;
    let interests = null;
    try{
        interests = await getInterests(rows[0]["userid"], "mentee")
    } catch(err){
        throw(err);
    }
    let mentee = new Mentee(menteeID, rows[0]["name"], rows[0]["businessarea"], rows[0]["email"], rows[0]["bio"], interests);
    return mentee;
}

/**
 * Gets all available mentors and uses them to create a list of Mentor objects
 * @throws {NoAvailableMentorsError} Thrown when there are no mentors available to tutor any mentees
 * @returns A list of Mentor objects
 */
async function getAvailableMentors(){
    let mentors = [];
    let mentorResults = null
    try{
        mentorResults = await pool.query(mentorQuery);
    } catch(err){
        throw(err);
    }
    
    let rows = mentorResults.rows;
    for(let i = 0; i < mentorResults.rowCount; ++i){
        let interests = null 
        try{
            interests = await getInterests(rows[i]["userid"], "mentor");
        } catch(err){
            if(err.name === "InterestsNotFoundError"){
                continue;
            }
            else {throw(err);}
        }
        mentors.push(new Mentor(rows[i]["userid"], rows[i]["name"], rows[i]["businessarea"], rows[i]["email"], rows[i]["bio"], interests, rows[i]["menteenum"])); 
    }
    return mentors;
}
/**
 * Creates a list of mentors matched to a mentee by the algorithm for the mentee's flag object
 * once matching is complete (but before the status flag is set).
 * @param {Flag} flag The flag corresponding to a mentee
 * @param {Array} mentors The list of mentors matched to the mentee
 */
async function createMentorList(flag, mentors){
    let tempList = [];
    for(let i = 0 ; i < mentors.length; ++i){
        tempList.push(mentors[i].second);
    }
    flag.setMentorList(tempList);
}

/**
 * Creates a map which stores common interests between a mentee and each available mentor.
 * This is acheived by storing (key, value) entries of which the key is the userid of a mentee 
 * and the value is another map. This map's (key, value) entries are a mentorid and an array of 
 * interests common to the mentee and mentor.
 * @returns A map as defined above.
 */
async function createMenteeMentorMap(){
    let map = new Map();
    let result = null;
    try{
         result = await pool.query(matchingInterestQuery);
    } catch(err){
        throw(err);
    }
                    
    for(let i = 0; i < result.rowCount; ++i){
        let row = result.rows[i];
        let newEntry = new Tuple(row["commoninterest"], new Tuple(row["menteerank"], row["mentorrank"]));
        if(!map.has(result.rows[i]["menteeid"])){
            let mentorMap = new Map();
            let interestArray = [newEntry];
            mentorMap.set(row["mentorid"], interestArray);
            map.set(row["menteeid"], mentorMap);
        }
        else{
            let mentorMap = map.get(row["menteeid"]);
            if(!mentorMap.has(row["mentorid"])){
                mentorMap.set(row["mentorid"], [newEntry]);
            } else{
                mentorMap.get(row["mentorid"])
                .push(newEntry);
            }
        }
    }
    return map;
}
 
/**
 * Formula to calculate a ranking (see calculateRanking function)
 * @param {Number} rank
 * @param {Number} numMatches 
 * @param {Number} numMentees
 * @return The ranking
 */
async function rankFormula(rank, numMatches, numMentees){
    return rank - (numMatches + (maxMentees - numMentees))/(maxInterests + maxMentees);
} 
/**
 * Calculates the lowest (best) possible ranking a mentor can be given when compared with a 
 * mentee
 * @param mentee_T Tuple containing the mentee
 * @param mentor The mentor
 * 
 * @return The calculated ranking
 */
async function calculateRanking(mentee_T, mentor){
    let rank = worstRanking;

    
    let commonInterestTuples = menteeMentorMap.get(mentee_T.first.userid).get(mentor.userid);
    for(let i = 0; i < commonInterestTuples.length; ++i){
        //Check if the mentee's ranking of an interest is lower than the current rank
        if(commonInterestTuples[i].second.first < rank){
            rank = commonInterestTuples[i].second.first;
        } 
    }

    rank = rankFormula(rank, commonInterestTuples.length, mentor.menteeNum);
    return rank;
}
/**
 * Creates a map which stores the mentors a mentee is already being tutored by
 * The map contains one entry per mentee, the key of which is the mentee's userid and 
 * the value of which is another map, containing mentorids as keys and null values.
 * This is used to efficiently query whether an available mentor is already tutoring
 * a mentee.
 * @return The map as defined above.
 */
async function getCurrentPairs(){
    let rows = null;
    
    try{ 
        rows = await pool.query(mentoringPairs); 
    } catch(err){
        throw(err);
    }
    let pairMap = new Map();

    for(let i = 0; i < rows.length; ++i){
        if(!pairMap.has(rows[i]["menteeid"])){
            let mentorMap = new Map();
            mentorMap.set(rows[i]["mentorid"], null);
            pairMap.set(rows[i]["menteeid"], mentorMap);
        } else{
            pairMap.get(rows[i]["menteeid"]).set(rows[i]["mentorid"], null);
        }
    }
    return pairMap;
}

/**
 * Sets the flag value of any Flags for mentees currently being considered
 * by the algorithm to the error value (-1)
 * @param err The error which caused the flags to be set to the error value 
 */
async function setErrorFlags(err){
    for(let i = 0; i < menteeFlags.length; ++i){
        menteeFlags[i].setFlag(-1);
        menteeFlags[i].setError(err);
    }
}


var pairMatching = {
/**
 * Adds a mentee to be matched with some mentors
 * @param {Flag} flag The flag of a mentee to be matched 
 */
async addMentee(flag){
    flagQueue.push(flag);
},
/**
 * Checks whether any mentees waiting to be matched should be matched.
 * Mentees will be matched when there are more than `poolLimit` (set at 10) mentees waiting
 * or if 1.5 seconds have passed since the last round of matching.
 */                  
async pollMatching(){
    ++pollCount;      
    if((flagQueue.length >= poolLimit || pollCount === pollLimit) && flagQueue.length > 0){
        pollCount = 0;
        try {
            await this.createMatches(flagQueue.splice(0, flagQueue.length));
        } catch(err) {
            setErrorFlags(err);
        }
        menteeFlags = [];
    }
    if(pollCount === pollLimit) pollCount = 0;    
},
/**
 * The matching algorithm. The full explanation of the algorithm is documented in the Final Report.
 * @param {Array} flagList A list of the flags of mentees to be matched with some mentors
 */
async createMatches(flagList){

    menteeFlags = flagList; //Flags of mentees to be matched with available mentors
    const mentees =  []; //Array of mentees to be matched
    let mentors = null; //Array of currently available mentors
    let currentPairs = null; //All already-existing pairings of mentors to mentees
    try {
        menteeMentorMap = await createMenteeMentorMap();

        for(let i = 0; i < menteeFlags.length; ++i){
            mentees.push( await createMenteeObj(menteeFlags[i].getMenteeID()));
        }
        mentors =  await getAvailableMentors(); 
        currentPairs = await getCurrentPairs(); 
    } catch(err){
        throw(err);
    }
    
    let assignedMentors = 0;
    
    /*
    Creates a tuple array whose elements are a mentee and an array of tuples containing a
    mentor matched with the mentor and the ranking calculated for that matching
    */
    const menteeArray = new Array();
    for(let i = 0; i < mentees.length; ++i){
        menteeArray.push(new Tuple(mentees[i], []));
    }

    /*
    While there are mentors who have not been considered as a match for some mentees, take each mentor
     and attempt to match them with each mentee they have not yet been considered for.
    */
    do{
        for(let i = 0; i < mentors.length; ++i){
            let mentor = mentors[i];
            let topMentee = new Tuple(worstRanking, null);
            for(let j = 0; j < menteeArray.length; ++j){

                let mentee_T = menteeArray[j]; //Tuple of a mentee and a list of tuples of mentors currently matched to them 
                                               //during the algorithms runtime and a calculated ranking for the match
              
                //If the mentor-mentee pair has already been considered, do not do so again
                if(mentee_T.first.consideredMentors.has(mentor.userid)){
                    continue;
                }
                //Do not attempt to match mentees and mentors with the same business area
                if(mentee_T.first.department === mentor.department || mentee_T.first.userid === mentor.userid){
                    mentee_T.first.consideredMentors.set(mentor, null);
                    ++assignedMentors;
                    continue;    
                }
                //Do not match mentees and mentors who are already paired
                if(currentPairs.has(mentee_T.first.userid)){
                    if(currentPairs.get(mentee_T.first.userid).has(mentor.userid)){
                        mentee_T.first.consideredMentors.set(mentor, null);
                        ++assignedMentors;
                        continue;
                    }
                }
                
                //Check for common interests between the mentor and mentee
                //If the mentor's ranking of a common interest is lower (= better) than a previous 
                //common interest between iteself and some mentee, record this ranking and the index
                //of the mentee as a tuple and store the tuple in topMentee
                //let commonInterests = 0;
                if(menteeMentorMap.get(mentee_T.first.userid).has(mentor.userid)){
                    let commonInterests = menteeMentorMap.get(mentee_T.first.userid).get(mentor.userid);
                    for(let k = 0; k < commonInterests.length; ++k){
                        if(commonInterests[k].second.second < topMentee.first){
                            topMentee = new Tuple(commonInterests[k].first, j);
                        }
                    }
                }
                else{ //If the mentor and mentee have no common interests, add them to the mentee's map of mentors already
                      //considered for the mentee so they are not matched again
                    mentee_T.first.consideredMentors.set(mentor, null);
                    ++assignedMentors;
                }
            }
            //Attempt to assign the mentor to the mentee which the mentor ranked the highest
            if(topMentee.second != null){
                mentee_T = menteeArray[topMentee.second]; //Mentee which ranked the highest for the mentor
                mentee_T.first.consideredMentors.set(mentor, null); //Record that the matching has been considered so it will not be again
                ++assignedMentors;
                //Calculate  the ranking that the mentee gives the mentor
                let rank = null 
                try{
                    rank = await calculateRanking(mentee_T, mentor);
                } catch(err){ throw err}
                //If the mentee has less than 5 mentors assigned to them, add the new mentor
                if(mentee_T.second.length < 5) {
                    mentee_T.second.push(new Tuple(rank, mentor));
                }
                //Otherwise, check if the new mentor is better ranked than one of 
                //the existing assignments and if so, replace the old assignment
                else{
                    let tempIndex = -1;
                    let tempRank = rank;
                    for(let p = 0; p < 5; ++p){
                        if(mentee_T.second[p].first > tempRank){
                            tempIndex = p;
                            tempRank = mentee_T.second[p].first
                        }
                    }
                    if(tempIndex != -1){
                        mentee_T.second[tempIndex] = new Tuple(rank, mentor);
                    }
                }
            }
        }
    }while(assignedMentors != menteeArray.length * mentors.length);

    /*
    For each mentee, sort the mentors assigned to them by their ranking and add this array 
    of mentors to the mentee's Flag.
    Set the flag value of each mentee to 1 to indicate that they have been 
    processed by the matching system and the mentors they have been matched
    to can be sent back to the mentee
    */
    for(let i = 0; i < menteeArray.length; ++i){
        menteeArray[i].second.sort();
        
        try{await createMentorList(menteeFlags[i], menteeArray[i].second);}
        catch(err) {throw err;}
        
        menteeFlags[i].setFlag(1);
    }
    //Empty the array of mentees
    menteeArray.shift(0, menteeArray.length + 1);
},
}

module.exports = {pairMatching, Mentee, Flag};