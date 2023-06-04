const express = require('express');
const app=express();
const fs = require('fs');
require('dotenv').config();
app.use(express.static('public'));

const { TextAnalysisClient, AzureKeyCredential } = require("@azure/ai-language-text");

const endpoint = process.env.ENDPOINT;
const apiKey = process.env.LANGUAGE_API_KEY;
const client = new TextAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

app.get('/', (req,res)=>{
fetch("http://localhost:3000/api/basliklar")
  .then(response => response.json()).then(function(data) {
	titles=data;
	res.render('titles.ejs',{titles});
	});
});

app.get('/:slug', (req,res)=>{
  console.log(req.params.slug)
    fetch("http://localhost:3000/api/baslik/" + req.params.slug).then(response => response.json()).then(async eksiData => {
      for (let index = 0; index < eksiData.entries.length; index++) {
        const result = await client.analyze("SentimentAnalysis", [eksiData.entries[index].body]);
        eksiData.entries[index].sentiment = result[0].sentiment;
        eksiData.entries[index].positiveConfidence = result[0]?.confidenceScores?.positive? JSON.stringify(result[0].confidenceScores.positive): "NA";
        eksiData.entries[index].negativeConfidence = result[0]?.confidenceScores?.negative? JSON.stringify(result[0].confidenceScores.negative): "NA";
        eksiData.entries[index].neutralConfidence = result[0]?.confidenceScores?.neutral? JSON.stringify(result[0].confidenceScores.neutral): "NA";
      }

        //to create a json file of our "entries"
        fs.writeFile('entries.json', JSON.stringify(eksiData, null, 2), (err) => {
          if (err) throw err;
          });

        res.render('entries.ejs',{eksiData});
        return eksiData;
      })
    });

app.listen(3001,()=>{
	console.log("listening..");
})