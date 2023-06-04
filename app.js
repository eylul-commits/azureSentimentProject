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
          const result = await client.analyze("SentimentAnalysis", [eksiData.entries.at(index).body]);
          eksiData.entries.at(index).sentiment = result[0].sentiment
          eksiData.entries.at(index).positiveConfidence = JSON.stringify(result[0].confidenceScores.positive);
          eksiData.entries.at(index).negativeConfidence = JSON.stringify(result[0].confidenceScores.negative);
          eksiData.entries.at(index).neutralConfidence = JSON.stringify(result[0].confidenceScores.neutral);
        }

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