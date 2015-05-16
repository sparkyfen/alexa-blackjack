var express = require('express');
var router = express.Router();

var alexa = require('alexa-nodekit');
var deckofcards = require('node-deckofcards');
var remaining = null;
var deckId = null;
var playerHand = [];
var echoHand = [];
var CARDS = [1,2,3,4,5,6,7,8,9,10];

function convertCard(card) {
  var faceCard = false;
  if(isNaN(parseInt(card, 10))) {
    faceCard = true;
  } else {
    card = parseInt(card, 10);
  }
  var cardIndex = CARDS.indexOf(card);
  if(!faceCard && cardIndex !== -1) {
    return CARDS[cardIndex];
  } else if (faceCard) {
    if(card === 'JACK' || card === 'QUEEN' || card === 'KING') {
      return 10;
    } else {
      return 11;
    }
  }
 }

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
        remaining = result.remaining;
        deckId = result.deck_id;
        alexa.response('Dealer is ready.', {
          title: 'Blackjack',
          subtitle: 'Dealer is ready.',
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
        remaining = result.remaining;
        var cards = result.cards.map(function (card) {
          delete card.images;
          delete card.image;
          return card;
        });
        playerHand = [cards[0], cards[2]];
        echoHand = [cards[1], cards[3]];
        alexa.response('Your hand has the ' + playerHand[0].value + ' of ' + playerHand[0].suit + ' and a '  + playerHand[1].value + ' of ' + playerHand[1].suit + ' for a total of ' + (convertCard(playerHand[0].value) + convertCard(playerHand[1].value))  + '. The dealers hand has the ' + echoHand[1].value + ' of ' + echoHand[1].suit, {
          title: 'Blackjack',
          subtitle: 'Hand played',
          content: 'Player: ' + playerHand[0].value + ': ' + playerHand[0].suit + ', ' + playerHand[1].value + ': ' + playerHand[1].suit + ' Echo: ' + echoHand[0].value + ': ' + playerHand[0].suit
        }, false, function (error, response) {
          if(error) {
            console.log(error);
            return res.status(500).jsonp({message: error});
          }
          return res.jsonp(response);
        });
      });
    } else if (intent === 'PlayerHits') {
      deckofcards.drawCard(deckId, 1, function (error, result) {
        if(error) {
          console.log(error);
          return res.status(500).jsonp({message: error});
        }
        remaining = result.remaining;
        if(remaining === 0) {
          deckofcards.reshuffle(deckId, function (error, result) {
            if(error) {
              console.log(error);
              return res.status(500).jsonp({message: 'Could not create new deck.'});
            }
            alexa.response('Cards has been resuffled, please state restart game.', {
              title: 'Blackjack',
              subtitle: 'Game restart.',
              content: 'Game has restarted, please restart game.'
            }, false, function (error, response) {
              if(error) {
                console.log(error);
                return res.status(500).jsonp({message: error});
              }
              return res.jsonp(response);
            });
          });
        } else {
          var cards = result.cards.map(function (card) {
            delete card.images;
            delete card.image;
            return card;
          });
          playerHand.push(cards[0]);
        }
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
