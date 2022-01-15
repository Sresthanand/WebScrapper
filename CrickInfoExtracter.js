// the purpose of this project is to extract information of worldcup 2019 from cricinfo and present
// that in the form of excel and pdf scorecards
// the real purpose is to learn how to extract information and get experience with js
// A very good reason to ever make a project is to have good fun

// npm init -y (first do this)
//libraries which will be used

// npm install minimist 
// npm install axios
// npm install jsdom
// npm install excel4node
//npm install path
// npm install pdf-lib
//terminal line -

// node CrickInfoExtracter.js --excel=Worldcup.csv --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results 

//requiring all the libraries
let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");

let args = minimist(process.argv);

//download html using axios
//extract information from html using jsdom
//manipulate data using array functions
//save in excel using excelnode
//create folders
//prepare pdf

let responseKaPromise = axios.get(args.source);

responseKaPromise.then(function(response){
    
    let html = response.data //html recieved

    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;

    let matches = [];
    let matchdivs = document.querySelectorAll("div.match-score-block"); //sari divs jiski class match-score-block hai vo mil jayegi

    for(let i = 0; i < matchdivs.length; i++){
         let matchdiv = matchdivs[i]; //taking a particular match at a time
        
        let match = { //make an object match
            t1: "",
            t2: "",
            t1s: "",
            t2s: "",
            result: "",
        };
        
        let teamParas = matchdiv.querySelectorAll("div.name-detail > p.name"); //sari divs jiski class name-detail hai and usme p name ki class hai
        match.t1 = teamParas[0].textContent; //filling the object created
        match.t2 = teamParas[1].textContent; //filling the object created

        let scoreSpans = matchdiv.querySelectorAll("div.score-detail > span.score");
        if(scoreSpans.length == 2){ //filling the object
           match.t1s = scoreSpans[0].textContent;
           match.t2s = scoreSpans[1].textContent;
        }else if(scoreSpans.length == 1){
            match.t1s = scoreSpans[0].textContent;
            match.t2s = "";
        }else{
            match.t1s = "";
            match.t2s = "";
        }
         let resultSpan = matchdiv.querySelector("div.status-text > span");
         match.result = resultSpan.textContent; //fillling the objext
        
         matches.push(match); //put match object made in matches array

         //till now all the match objects are created and put in the array
    }
     
    let matchesJSON = JSON.stringify(matches);
    fs.writeFileSync("matches.json" , matchesJSON , "utf-8");

    let teams = [];
    for(let i = 0; i < matches.length; i++){ //applying loop on the matches array which has match as an object
        putTeamsInArrayIfMissing(teams , matches[i]); //passing teams array and matches[i] represents the particular match 
        //calling function which will put all teams together
    }
    for(let i = 0; i < matches.length; i++){ //applying loop on the matches array which has match as an object
        putMatchInAppropriateTeam(teams,matches[i]); //now teams array has been filled(from above function created)
        //calling function and now we are putting all the matches of a particular team/ country together
        //aus ke saare matches ek saath
        //india ke saare matches ek saath aise
    }
     //now we can read it in the form of objects
     
     //converting jso to json
     let teamsJSON = JSON.stringify(teams);
     fs.writeFileSync("teams.json" , teamsJSON, "utf-8"); //teams ka json created

     //creating excelfile

     createExcelFile(teams); //passing teams
     createFolders(teams); //this will create folders 

})

function putTeamsInArrayIfMissing(teams , match){
    //for team1
    let t1kaindex = -1;
    for(let i = 0; i < teams.length; i++){ //loop on teams array
        if(teams[i].name == match.t1){ //already team/country is present
            t1kaindex = i;   //updating index
            break; 
        }
    }

    //if that team/country is not already is present
    if(t1kaindex == -1){
        teams.push({    //pushing that team in the teams array as the form of an object
            name: match.t1,  //name of team
            matches:[] //passing matches array to store all the matches of a particular team/country later on
        });
    }

     //same thing for team2
     let t2kaindex = -1;
     for(let i = 0; i < teams.length; i++){ 
         if(teams[i].name == match.t2){
             t2kaindex = i;  
             break; 
         }
     }
 
     if(t2kaindex == -1){
         teams.push({    
             name: match.t2, 
             matches:[] 
         });
     }
    
}

function putMatchInAppropriateTeam(teams , match){
    //for team1
 let t1kaindex = -1;
 for(let i = 0; i <teams.length; i++){
     if(teams[i].name == match.t1){ //match is passed in function
        t1kaindex = i; //updaating i
        break;
     }
 }

 let team1 = teams[t1kaindex]; //index from above , team1 declared
 team1.matches.push({  //creating an object ,  team1 ke matches ke array me push krdenge(matches ka array upar banaya hai name k saath)
    vs: match.t2,
    selfScore: match.t1s, //using match object which is passed in function
    oppScore: match.t2s,
    result: match.result
 });


 //same for t2
 let t2kaindex = -1;
 for(let i = 0; i <teams.length; i++){
     if(teams[i].name == match.t2){
        t2kaindex = i; 
        break;
     }
 }

 let team2 = teams[t2kaindex]; 
 team2.matches.push({ 
    vs: match.t1,     //opponent t1
    selfScore: match.t2s, 
    oppScore: match.t1s,
    result: match.result
 });
}

function createExcelFile(teams){
    let wb = new excel.Workbook();

    for(let i = 0; i < teams.length; i++){
        let sheet = wb.addWorksheet(teams[i].name); //name of country/team se particular excel file sheet banegi

        sheet.cell(1,1).string("VS");
        sheet.cell(1,2).string("Self Score");
        sheet.cell(1,3).string("Opp Score");
        sheet.cell(1,4).string("Result");
        
        for(let j = 0; j < teams[i].matches.length; j++){ //particular team/country ke matches pe loop lagega so that we can extract its all details
            sheet.cell(2 + j, 1).string(teams[i].matches[j].vs);
            sheet.cell(2 + j, 2).string(teams[i].matches[j].selfScore);
            sheet.cell(2 + j, 3).string(teams[i].matches[j].oppScore);
            sheet.cell(2 + j, 4).string(teams[i].matches[j].result);
        }
    }
    wb.write(args.excel);
}

function createFolders(teams){ 

 fs.mkdirSync(args.dataFolder); //it will create the folder of the name passed in terminal line

 for(let i = 0; i < teams.length; i++){
     let teamFN = path.join(args.dataFolder , teams[i].name); //folder ke andar teams/countries ka name ka folder banna dega
    fs.mkdirSync(teamFN);

    for(let j = 0; j < teams[i].matches.length; j++){ //loop on teams ke matches pe loop chalgea to extract all details
        let matchFileName = path.join(teamFN , teams[i].matches[j].vs + ".pdf");
        //creating file/pdf  
        createScoreCard(teams[i].name , teams[i].matches[j], matchFileName);
     }
 }
}

function createScoreCard(teamName , match , matchFileName){
    let t1 = teamName;
    let t2 = match.vs;
    let t1s = match.selfScore;
    let t2s = match.oppScore;
    let result = match.result;

    let bytesOfPDFTemplate = fs.readFileSync("Template.pdf"); //create khud se template.pdf
    let pdfdocKaPromise = pdf.PDFDocument.load(bytesOfPDFTemplate);
    pdfdocKaPromise.then(function(pdfdoc){
        let page = pdfdoc.getPage(0);

        page.drawText(t1, {
            x : 320,
            y: 729,
            size: 8
        });
        page.drawText(t2, {
            x : 320,
            y: 715,
            size: 8
        });
        page.drawText(t1s, {
            x : 320,
            y: 701,
            size: 8
        });
        page.drawText(t2s, {
            x : 320,
            y: 687,
            size: 8
        });
        page.drawText(result, {
            x : 320,
            y: 673,
            size: 8
        });

        let finalPDFBytesKaPromise = pdfdoc.save();
        finalPDFBytesKaPromise.then(function(finalPDFBytes){
            fs.writeFileSync(matchFileName , finalPDFBytes)     //matchfilename is the name of the file of the match whch will be
        })
    })
}
