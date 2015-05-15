var express = require('express');
var router = express.Router();

var alexa = require('alexa-nodekit');

router.get('/play', function (req, res) {
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
