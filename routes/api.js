var express = require('express');
var router = express.Router();

var alexa = require('alexa-nodekit');
var deckofcards = require('node-deckofcards');

router.post('/play', function (req, res) {
  if(!(req.body.request && req.body.request.type)) {
    return res.status(400).jsonp({message: 'Probably not an Amazon Echo request.'});
  }
  var sessionId;
  var userId;
  if(req.body.request.type === 'LaunchRequest') {
    alexa.launchRequest(req.body);
    sessionId = alexa.sessionId;
    userId = alexa.userId;
    alexa.response('Welcome to Blackjack, you can start a new deck, reshuffle the current deck, hit, or stay.', {
      title: 'Blackjack',
      subtitle: 'Welcome to Blackjack.',
      content: 'Start a new deck, reshuffle deck, hit, or stay.'
    }, false, function (error, response) {
      if(error) {
        return res.status(500).jsonp({message: error});
      }
      return res.jsonp(response);
    });
  } else if (req.body.request.type === 'IntentRequest') {
    alexa.intentRequest(req.body);
    sessionId = alexa.sessionId;
    userId = alexa.userId;
    var intent = alexa.intentName;
    var slots = alexa.slots;
    if(intent === 'NewDeck') {
      deckofcards.shuffle(6, function (error, result) {
        if(error) {
          console.log(error);
          return res.status(500).jsonp({message: 'Could not create new deck.'});
        }
        var remaining = result.remaining;
        var deckId = result.deck_id;
        alexa.response('Dealer is ready.', {
          title: 'Blackjack',
          subtitle: '',
          content: 'Dealer is ready.'
        }, false, function (error, response) {
          if(error) {
            console.log(error);
            return res.status(500).jsonp({message: error});
          }
          return res.jsonp(response);
        });
      });
    } else if (intent === 'StartGame') {
      deckofcards.drawCard(deckId, 4, function (error, result) {
        if(error) {
          console.log(error);
          return res.status(500).jsonp({message: error});
        }
        var remaining = result.remaining;
        var cards = result.cards.map(function (card) {
          delete card.images;
          delete card.image;
          return card;
        });
        var playerHand = [cards[0], cards[2]];
        var echoHand = [cards[1], cards[3]];
        alexa.response('Your hand has the ' + playerHand[0].value + ' of ' + playerHand[1].suit + ' and the dealers hand has the ' + echoHand[1].value + ' of ' + echoHand[1].suit, {
          title: 'Blackjack',
          subtitle: 'Hand played',
          content: 'Player: ' + playerHand[0].value + ': ' + playerHand[0].suit + ' Echo: ' + echoHand[0].value + ': ' + playerHand[0].suit
        }, false, function (error, response) {
          if(error) {
            console.log(error);
            return res.status(500).jsonp({message: error});
          }
          return res.jsonp(response);
        });
      });
    }
  } else {
    alexa.sessionEndedRequest(req.body);
    sessionId = alexa.sessionId;
    userId = alexa.userId;
    var sessionEndReason = alexa.reason;
    alexa.response(function (error, response) {
      if(error) {
        return res.status(500).jsonp(error);
      }
      return res.jsonp(response);
    });
  }
});

module.exports = router;
