'use strict'

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN)
const SERVER_URL = (process.env.SERVER_URL)
const token = (process.env.MESSENGER_PAGE_ACCESS_TOKEN)
const serveStatic = require('serve-static')

// load shelljs and chance
const shell = require('shelljs');
const Chance = require('chance');
var chance = new Chance();

// Load ReadLastLines
const readLastLines = require('read-last-lines');


app.set('port', (process.env.PORT || 3000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

// index
//app.get('/', function (req, res) {
//	res.send('hello world i am a secret bot')
//})

//servestatic for assets
app.use(serveStatic(__dirname + '/public', {
  maxAge: '1d',
  setHeaders: setCustomCacheControl
}))

function setCustomCacheControl (res, path) {
  if (serveStatic.mime.lookup(path) === 'text/html') {
    // Custom Cache-Control for HTML files
    res.setHeader('Cache-Control', 'public, max-age=0')
  }
}

// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === VALIDATION_TOKEN) {
		res.send(req.query['hub.challenge'])
	} else {
		res.send('Error, wrong token')
	}
})

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});


/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;
  var buttons = message.buttons;

  if (isEcho) {
    console.log("Received echo for message %s and app %d with metadata %s",
      messageId, appId, metadata);
     return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);
	switch (quickReplyPayload) {
	  case 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY':
		sendTextMessage(senderID, "comedy choosed");
		break;

	  case 'Categories_Back_PAYLOAD':
		sendFoodborneQuickReply(senderID);
		break;

	  case 'Categories_More_PAYLOAD':
		sendTextMessage(senderID, "For details\, just type an organism or a disease name\. For Example\, \"Aeromonas enteritis\" or \"Aeromonas hydrophila\" \(without \"\"\)");
		break;


	}
		//sendTextMessage(senderID, "Quick reply tapped");
    return;
  }

  if (messageText) {
    // find special keywords from messageText and reply accordingly
    messageText = messageText || "";
	  //split text into words for conditional responses
	  //var values = text.split(" ");
	  var what = messageText.match(/what/gi);
	  var formyanmar = messageText.match(/formyanmar/gi);
	  var who = messageText.match(/who/gi);
	  var you = messageText.match(/you/gi);
    var your = messageText.match(/your/gi);
    var name = messageText.match(/name/gi);
    // antidotes of drugs

    if (who != null && you != null) {
      sendTextMessage(senderID, "I am For Myanmar Bot.");
    }else if (what != null && formyanmar != null) {
      sendTextMessage(senderID, "For Myanmar is website hosting Company founded by Dr. Soe Paiing since 2011.");
    }
    else if (what != null && your != null && name != null) {
      sendTextMessage(senderID, "You can call me \"FM Bot\".");
    }else{

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText.toLowerCase()) {

      case 'help':
		sendGetStartedQuickReply(senderID);
		break;


	  case 'hi':
	  case 'hello':
		sendTextMessage(senderID, "Hi. Nice to meet you. I am FM Bot");
		break;

	  case 'မင်္ဂလာပါ':
		sendTextMessage(senderID, "မင်္ဂလာပါ ကျွန်တော်ကတော့ For Myanmar စက်ရုပ်ပါ");
		break;

	  case 'မဂၤလာပါ':
		sendTextMessage(senderID, "မဂၤလာပါ က်ြန္ေတာ္ကေတာ့ For Myanmar စက္ရုပ္ပါ");
		break;

    default:
    sendTextMessage(senderID, "");
    }
  }
  } else if (messageAttachments) {
    if (message.attachments[0].type == "image"){
	  var messageAttachmenturl = "\"" + message.attachments[0].payload.url + "\"";
	  var my_random_string = chance.first();
	  shell.exec('wget --accept .jpg,.jpeg --cookies=on -p ' + messageAttachmenturl + ' -O ../mynodeapp/public/' + my_random_string + '.jpg', function(code, stdout, stderr) {
  	console.log('Exit code:', code);
  	console.log('Program output:', stdout);
		readLastLines.read('/home/soepaing/.pm2/logs/devbot-error-0.log', 5)
     .then((lines) => sendTextMessage(senderID, lines));
     sendTextMessage(senderID, "The photo was saved to https\:\/\/health\.formyanmar\.tk\/" + my_random_string + "\.jpg" );
	  });
  } else {
    sendTextMessage(senderID, "Message with attachment received");
    }
   }
  }




/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s",
        messageID);
    });
  }
   console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

    // test payload for test button
    if (payload) {

	 switch (payload) {
	  case 'testing_postback_button_was_clicked':
		sendTextMessage(senderID, "testing sucessful");
		break;

	  case 'GET_STARTED_PAYLOAD':
		sendGetStartedQuickReply(senderID);
		break;

	  default:
        sendTextMessage(senderID, "Postback called");
	}
		}

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful

}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;
// commenting these logging for testing purpose
  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

// this is test convo box function
function sendConvoBox (recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: "Thanks for purchase, This item will deliver to your location as soon as possible. \nWhat is your name?",
			metadata: "DEVELOPER_DEFINED_METADATA"
		}

	};

	callSendAPI(messageData);

}

/*
 * Send cephalexin dose png image
 *
 */
function sendCephalexinDoseImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/cephalexin_dose.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send burmeton dose png image
 *
 */
function sendBurmetonDoseImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/burmeton_dose.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

// this is test sendaudio function
function sendTestAudioMessage(recipientId, audiourl)	{
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment:{
				type:"audio",
				payload:{
					url:SERVER_URL+audiourl
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * /assets/allofus480.mov
 */
function sendVideoMessage(recipientId, videourl) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + videourl
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a file using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

// test function for send message
function sendTestTextMessage(messageText) {
  var messageData = {
    recipient: {
// my id
id: "1487429057934939"
// may may id
// id: "1329664593737348"
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
  }
};

callSendAPI(messageData);
}
//sendTestTextMessage("Hi its worked");
// send a text message to a user at specific date and time
var CronJob = require('cron').CronJob;
new CronJob(new Date("July 03, 2017 07:28:00"), function() {
sendTestTextMessage("Hey I send you this message at specific date and time \"July 03, 2017 07:28:00\"");
}, null, true, 'Asia/Yangon');
// this is test sendimage function
function sendTestImageMessage(recipientId, imageurl)	{
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment:{
				type:"image",
				payload:{
					url:SERVER_URL+imageurl
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPER_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * button message testing
 *
 */
function sendTestButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is tested button message",
          buttons:[{
            type: "web_url",
            url: "https://www.google.com/",
            title: "Google it"
          }, {
            type: "postback",
            title: "What is button message?",
            payload: "testing_postback_button_was_clicked"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+959972973223"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

//sendBloodTubeGenericMessage

function sendBloodTubeGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Common Blood Collection Tube",
            subtitle: "their additives and laboratory uses.",
            item_url: "http://www.medcyclopedia.net/common-blood-collection-tubes-their-additives-and-laboratory-uses/",
            image_url: SERVER_URL + "/bt/blood-tubes.jpg",
            buttons: [{
              type: "web_url",
              url: "http://www.medcyclopedia.net/common-blood-collection-tubes-their-additives-and-laboratory-uses/",
              title: "View on Web"
            }],
          }]
        }
      },
      quick_replies: [
        {
          "content_type":"text",
          "title":"Red",
          "payload":"Red_Blood_Tubes"
        },
        {
          "content_type":"text",
          "title":"Yellow",
          "payload":"Yellow_Blood_Tubes"
        },
        {
          "content_type":"text",
          "title":"Light Blue",
          "payload":"Light_Blue_Blood_Tubes"
        },
        {
          "content_type":"text",
          "title":"Green",
          "payload":"Green_Blood_Tubes"
        },
        {
          "content_type":"text",
          "title":"Lavender",
          "payload":"Lavender_Blood_Tubes"
        },
        {
          "content_type":"text",
          "title":"Grey",
          "payload":"Grey_Blood_Tubes"
        },
        {
          "content_type":"text",
          "title":"Royal Blue",
          "payload":"Royal_Blue_Blood_Tubes"
        },
        {
          "content_type":"text",
          "title":"Black",
          "payload":"Black_Blood_Tubes"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

//sendMyanmarHealthCentersQuickReply
/*
function sendMyanmarHealthCentersQuickReply(recipientId, imageurl) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment:{
				type:"image",
				payload:{
					url:SERVER_URL+imageurl
				}
			},
      quick_replies: [
        {
          "content_type":"text",
          "title":"AyeYarWadi",
          "payload":"AyeYarWadiPayload"
        },
        {
          "content_type":"text",
          "title":"Bago",
          "payload":"BagoPayload"
        },
        {
          "content_type":"text",
          "title":"Chin",
          "payload":"ChinPayload"
        },
        {
          "content_type":"text",
          "title":"Kachin",
          "payload":"KachinPayload"
        },
        {
          "content_type":"text",
          "title":"Kayar",
          "payload":"KayarPayload"
        },
        {
          "content_type":"text",
          "title":"Kayin",
          "payload":"KayinPayload"
        },
        {
          "content_type":"text",
          "title":"Magwe",
          "payload":"MagwePayload"
        },
        {
          "content_type":"text",
          "title":"Mandalay",
          "payload":"MandalayPayload"
        },
        {
          "content_type":"text",
          "title":"Mon",
          "payload":"MonPayload"
        },
        {
          "content_type":"text",
          "title":"NayPyiTaw",
          "payload":"NayPyiTawPayload"
        },
        {
          "content_type":"text",
          "title":"Rakhine",
          "payload":"RakhinePayload"
        },
        {
          "content_type":"text",
          "title":"Sagaing",
          "payload":"SagaingPayload"
        },
        {
          "content_type":"text",
          "title":"Shan",
          "payload":"ShanPayload"
        },
        {
          "content_type":"text",
          "title":"TaNinTharYi",
          "payload":"TaNinTharYiPayload"
        },
        {
          "content_type":"text",
          "title":"Yangon",
          "payload":"YangonPayload"
        }
      ]
    }
  };

  callSendAPI(messageData);
}
*/

/*
 * test generic message for webview
 *
 */
function sendTestGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://docs.google.com/forms/d/e/1FAIpQLSe3S4kOw__1esQ835RWhlPDD03uOhxpUKEdOE4h5Zh9ZKNw0Q/viewform?usp=pp_url&entry.1991652553&entry.560259158&entry.1928389408&entry.221518448=rift-001",
              title: "Buy Now",
              webview_height_ratio:"compact"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",
          timestamp: "1428444852",
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

//foodborne diseases quickReply
function sendFoodborneQuickReply(recipientId) {
	var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Choose from following categories..",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Bacteria",
          "payload":"Bacteria_PAYLOAD"
        },
        {
          "content_type":"text",
          "title":"Viruses",
          "payload":"Viruses_PAYLOAD"
        },
        {
          "content_type":"text",
          "title":"Protozoa",
          "payload":"Protozoa_PAYLOAD"
        },
		{
          "content_type":"text",
          "title":"Trematodes",
          "payload":"Trematodes_PAYLOAD"
        },
		{
          "content_type":"text",
          "title":"Cestodes",
          "payload":"Cestodes_PAYLOAD"
        },
		{
          "content_type":"text",
          "title":"Nematodes",
          "payload":"Nematodes_PAYLOAD"
        },
		{
          "content_type":"text",
          "title":"Natural toxins",
          "payload":"Natural_Toxins_PAYLOAD"
        },
		{
          "content_type":"text",
          "title":"Chemicals",
          "payload":"Chemicals_PAYLOAD"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

//quick reply for each categories
function sendCategoriesQuickReply(recipientId, imageurl) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment:{
				type:"image",
				payload:{
					url:SERVER_URL+imageurl
				}
			},
      quick_replies: [
        {
          "content_type":"text",
          "title":"Back",
          "payload":"Categories_Back_PAYLOAD"
        },
        {
          "content_type":"text",
          "title":"More",
          "payload":"Categories_More_PAYLOAD"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

//get started quick reply
function sendGetStartedQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Welcome to developbot\! \nYou can now ask Bot like \"cephalexin\"\, \"Propofol\"\, \"Diabetes\"\, \"Hi\"\, \"Test tubes\"\, \"Milestones\" \nAny time you need this help\, just text \"Help\" to me\.",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Cephalexin",
          "payload":"Cephalexin_Payload"
        },
        {
          "content_type":"text",
          "title":"Diabetes",
          "payload":"Diabetes_Payload"
        },
        {
          "content_type":"text",
          "title":"Test tubes",
          "payload":"Test_Tubes_Payload"
        },
        {
          "content_type":"text",
          "title":"Milestones",
          "payload":"Milestones_Payload"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

//developmental milestones quick reply
function sendMilestonesQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Which one?",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Gross motor",
          "payload":"Gross_Motor_Developmental_Milestones"
        },
        {
          "content_type":"text",
          "title":"Fine motor",
          "payload":"Fine_Motor_Developmental_Milestones"
        },
        {
          "content_type":"text",
          "title":"Social & Adaptive",
          "payload":"Social_Developmental_Milestones"
        },
        {
          "content_type":"text",
          "title":"Language",
          "payload":"Language_Developmental_Milestones"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

//sendDiabetesQuickReply
function sendDiabetesQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What type of Diabetes",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Type 1",
          "payload":"Type1_DM_Chart"
        },
        {
          "content_type":"text",
          "title":"Type 2",
          "payload":"Type2_DM_Chart"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.9/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
      // comment these logging for testing purpose

        console.log("Successfully sent message with id %s to recipient %s",
        messageId, recipientId);
      } else {
       console.log("Successfully called Send API for recipient %s",
        recipientId);
      }
    } else {
       console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

//post persistent menu
/*function setPersistentMenu()	{
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
		qs: {access_token: token},
		method: 'POST',
		json: {
  "persistent_menu":[
    {
      "locale":"default",
      "composer_input_disabled":true,
      "call_to_actions":[
        {
          "title":"My Account",
          "type":"nested",
          "call_to_actions":[
            {
              "title":"Pay Bill",
              "type":"postback",
              "payload":"PAYBILL_PAYLOAD"
            },
            {
              "title":"History",
              "type":"postback",
              "payload":"HISTORY_PAYLOAD"
            },
            {
              "title":"Contact Info",
              "type":"postback",
              "payload":"CONTACT_INFO_PAYLOAD"
            }
          ]
        },
        {
          "type":"web_url",
          "title":"Latest News",
          "url":"http://petershats.parseapp.com/hat-news",
          "webview_height_ratio":"full"
        }
      ]
    },
    {
      "locale":"zh_CN",
      "composer_input_disabled":false
    }
  ]
}
		},	function (error, response, body)	{
			var resultjson = body.result;
	//		if (error)	{
	//			console.error("error setting persistent menu");
	//			} else {
	//				console.log("persistent menu successfully set with %s result", resultjson);
	//				}

			if (!error && response.statusCode == 200)	{
				console.log("persistent menu successfully set with %s result", resultjson);
				} else {
					console.error("error setting persistent menu");
					}
			}
	);
	}

setPersistentMenu();
*/

//get started button
/*function GetStartedButton()	{
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
		qs: {access_token: token},
		method: 'POST',
		json: {
  "get_started":{
    "payload":"GET_STARTED_PAYLOAD"
  }
}
		},	function (error, response, body)	{
			var resultjson = body.result;
		//	if (error)	{
		//		console.error("error setting persistent menu");
		//		} else {
		//			console.log("persistent menu successfully set with %s result", resultjson);
		//			}

			if (!error && response.statusCode == 200)	{
				console.log("get started button successfully set with %s result", resultjson);
				} else {
					console.error("error setting get started button");
					}
			}
	);
	}

GetStartedButton();
*/

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

