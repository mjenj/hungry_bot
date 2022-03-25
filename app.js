var http = require('http');
http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Hello World!');
    res.end();
}).listen(process.env.PORT || 3000);

// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
var cron = require('node-cron');

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    port: process.env.PORT || 3000
});

var avaidMotd = [];
var avaidSotd = [];
var avaidFd = [];
var avaidUknown = [];
var claimedMeals = [];
var hasSeenMessageToday = false;

// MARK: Actions
// app.action("donate_motd", ({ event, say, body }) => {
//     avaidMotd.push({
//         owner: body.user.id,
//         ownerName: `<${body.user.id}>`,
//         type: "MOTD",
//         timeIn: event.time,
//         timeOut: ""
//     });
//     console.log(avaidMotd);
// });

// app.action("donate_sotd", ({ event, say, body }) => {
//     avaidSotd.push({
//         owner: body.user.id,
//         ownerName: `<${body.user.id}>`,
//         type: "SOTD",
//         timeIn: event.time,
//         timeOut: ""
//     });
//     console.log(avaidSotd);
// });

// app.action("donate_fd", ({ event, say, body }) => {
//     avaidFd.push({
//         owner: body.user.id,
//         ownerName: `<${body.user.id}>`,
//         type: "FD",
//         timeIn: event.time,
//         timeOut: ""
//     });
//     console.log(avaidFd);
// });

// app.action("claim_sotd", async({ event, say, body }) => {
//     if (avaidSotd.length > 0) {
//         var meal = avaidSotd.shift();
//         meal["claimer"] = body.user.id;
//         meal["claimerName"] = `<${body.user.id}>`,
//         meal["timeOut"] = event.time;
//         await say("You got a SOTD from " + `<@${meal.owner}>`);
//         claimedMeals.push(meal);
//     }
// });

// app.action("claim_motd", async({ event, say, body }) => {
//     if (avaidMotd.length > 0) {
//         var meal = avaidMotd.shift();
//         meal["claimer"] = body.user.id;
//         meal["claimerName"] = `<${body.user.id}>`,
//         meal["timeOut"] = event.time;
//         await say("You got a MOTD from " + `<@${meal.owner}>`);
//         claimedMeals.push(meal);
//     }
// });

// app.action("claim_fd", async({ event, say, body }) => {
//     if (avaidFd.length > 0) {
//         var meal = avaidFd.shift();
//         meal["claimer"] = body.user.id;
//         meal["claimerName"] = `<${body.user.id}>`,
//         meal["timeOut"] = event.time;
//         await say("You got a FD from " + `<@${meal.owner}>`);
//         claimedMeals.push(meal);
//     }
// });

app.action("actionFeed", async({ body, ack, say }) => {
    await ack();
    await say({
        blocks: [{
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Thank you for feeding a hungry Skynamite with a: ",
            },
            accessory: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Options",
                    emoji: true,
                },
                options: [{
                        text: {
                            type: "plain_text",
                            text: "MOTD",
                            emoji: true,
                        },
                        value: "value-motd",
                    },
                    {
                        text: {
                            type: "plain_text",
                            text: "SOTD",
                            emoji: true,
                        },
                        value: "value-sotd",
                    },
                    {
                        text: {
                            type: "plain_text",
                            text: "FD",
                            emoji: true,
                        },
                        value: "value-fd",
                    },
                    {
                      text: {
                          type: "plain_text",
                          text: "Don't remember",
                          emoji: true,
                      },
                      value: "value-unknown",
                  },
                ],
                action_id: "meal-type-selected-give",
            },
        }, ],
        text: "home",
    });
});

app.action("actionEat", async({ body, ack, say }) => {
    await ack();
    // await say(`<@${body.user.id}> you lazy fuck`);
    await say("There are " + avaidMotd.length + " MOTD's, " + avaidSotd.length + " SOTD's, " + avaidFd.length + " FD's and " + avaidUknown.length + "Lucky Packets");
    await say({
        blocks: [{
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Beggars CAN be choosers",
            },
            accessory: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Options",
                    emoji: true,
                },
                availableOptionGenerator,
                action_id: "meal-type-selected-take",
            },
        }, ],
        text: "home",
    });
});

function availableOptionGenerator() {
  var fd = avaidFd.length;
  var motd = avaidMotd.length;
  var sotd = avaidSotd.length;
  var unknown = avaidUknown.length;
  var anyAvailable = fd > 0 | motd > 0 | sotd > 0 | unknown > 0;

  var options = [];

  if (motd > 0) {
    options.push({
      text: createOption("MOTD"),
      value: "value-motd"
    })
  }
  if (sotd > 0) {
    options.push({
      text: createOption("SOTD"),
      value: "value-sotd"
    })
  }
  if (fd > 0) {
    options.push({
      text: createOption("FD"),
      value: "value-fd"
    })
  }
  if (unknown > 0) {
    options.push({
      text: createOption("Lucky Packet"),
      value: "value-unkown"
    })
  }
  if (anyAvailable > 0) {
    options.push({
      text: createOption("I'll take anything"),
      value: "value-any"
    })
  }
  var final = ({
    options: options
  })

  return JSON.stringify(final, null, 2);
}

function createOption(title) {
  var option = ({
    type: "plain_text",
    text: title,
    emoji: true,
  });
  return option;
}

app.action("meal-type-selected-take", async({ body, ack, say, action }) => {
    await ack();
    // await say(`<@${body.user.id}> you lazy fuck`);
    var value = action.selected_option.value;

    if (value === 'value-motd') {
        claimMOTD(say, body, action);
    } else if (value === 'value-sotd') {
        claimSOTD(say, body, action);
    } else if (value === 'value-fd') {
        claimFD(say, body, action);
    } else if (value === 'value-unknown') {
        claimUknown(say, body, action);
    } else {
        claimANY(say, body, action);
    }
});

app.action("meal-type-selected-give", async({ body, ack, say, action }) => {
    await ack();
    // await say(`<@${body.user.id}> you lazy fuck`);
    var value = action.selected_option.value;

    if (value === 'value-motd') {
        giveMOTD(say, body, action);
    } else if (value === 'value-sotd') {
        giveSOTD(say, body, action);
    } else if (value === 'value-fd') {
        giveFD(say, body);
    } else if (value === 'value-uknown') {
      giveUnkown(say, body, action);
    }
});

// MARK: Functions
function giveMOTD(say, body, action) {
    avaidMotd.push({
      owner: body.user.id,
      ownerName: `<@${body.user.id}>`,
      type: "MOTD",
      timeIn: action.action_ts,
      timeOut: ""
    });
    say("Thank you for your donation, you've saved a starving african");
}

function giveSOTD(say, body, action) {
    avaidSotd.push({
      owner: body.user.id,
      ownerName: `<@${body.user.id}>`,
      type: "SOTD",
      timeIn: action.action_ts,
      timeOut: ""
    });
    say("Thank you for your donation, you've saved a starving african");
}

function giveFD(say, body, action) {
    avaidFd.push({
      owner: body.user.id,
      ownerName: `<@${body.user.id}>`,
      type: "FD",
      timeIn: action.action_ts,
      timeOut: ""
    });
    say("Thank you for your donation, you've saved a starving african");
}

function claimMOTD(say, body, action) {
    if (avaidMotd.length > 0) {
        var meal = avaidMotd.shift();
        meal["claimer"] = body.user.id;
        meal["claimerName"] = `<@${body.user.id}>`,
        meal["timeOut"] = action.action_ts;
        say("You got a MOTD from " + `<@${meal.owner}>`);
        claimedMeals.push(meal);
    } else {
      say("No MOTD's available right now");
    }
}

function claimSOTD(say, body, action) {
    if (avaidSotd.length > 0) {
        var meal = avaidSotd.shift();
        meal["claimer"] = body.user.id;
        meal["claimerName"] = `<@${body.user.id}>`,
        meal["timeOut"] = action.action_ts;
        say("You got a SOTD from " + `<@${meal.owner}>`);
        claimedMeals.push(meal);
    } else {
      say("No SOTD's available right now");
    }
}

function claimFD(say, body, action) {
    if (avaidFd.length > 0) {
        var meal = avaidFd.shift();
        meal["claimer"] = body.user.id;
        meal["claimerName"] = `<@${body.user.id}>`,
        meal["timeOut"] = action.action_ts;
        say("You got a FD from " + `<@${meal.owner}>`);
        claimedMeals.push(meal);
    } else {
      say("No FD's available right now");
    }
}

function claimUknown(say, body, action) {
  if (avaidUknown.length > 0) {
      var meal = avaidFd.shift();
      meal["claimer"] = body.user.id;
      meal["claimerName"] = `<@${body.user.id}>`,
      meal["timeOut"] = action.action_ts;
      say("You got a Lucky Packet from " + `<@${meal.owner}>`);
      claimedMeals.push(meal);
  } else {
    say("No Lucky Packets available right now");
  }
}

function claimANY(say, body, action) {
    var fd = avaidFd.length;
    var motd = avaidMotd.length;
    var sotd = avaidSotd.length;
    var unkown = avaidUknown.length;

    var available = [];
    if (fd > 0) available.push('fd');
    if (motd > 0) available.push('motd');
    if (sotd > 0) available.push('sotd');
    if (unkown > 0) available.push('unkown');

    if (available.length > 0) {
        var choice = Math.floor(Math.random()) * available.length - 1;
        if (available[choice] === 'motd') {
            claimMOTD(say, body, action);
        } else if (available[choice] === 'sotd') {
            claimSOTD(say, body, action);
        } else if (available[choice] === 'fd') {
            claimFD(say, body, action);
        } else if (available[choice] === 'unkown') {
          claimUknown(say, body, action);
      }
    } else {
        say("Oh no! No meals available right now, try again later ");
    }
}

// MARK: Message commands
app.message("purge", async({ event, say }) => {
    avaidMotd = [];
    avaidSotd = [];
    avaidFd = [];
    claimedMeals = [];
    hasSeenMessageToday = false;
});

app.message("setPurge", async({ event, say }) => {
    cron.schedule('0 18 * * Mon,Tue,Wed,Thu,Fri', () => {
        avaidMotd = [];
        avaidSotd = [];
        avaidFd = [];
        claimedMeals = [];
        hasSeenMessageToday = false;
    });
});


app.message("claim", async({ event, say }) => {
    await say("there are MOTD " + avaidMotd.length);
    await say("there are SOTD " + avaidSotd.length);
    await say("there are FD " + avaidFd.length);
    await say({
        blocks: [{
                type: "actions",
                elements: [{
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Claim MOTD",
                        emoji: true,
                    },
                    value: "click_me_123",
                    action_id: "claim_motd",
                }, ],
            },
            {
                type: "actions",
                elements: [{
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Claim SOTD",
                        emoji: true,
                    },
                    value: "click_me_123",
                    action_id: "claim_sotd",
                }, ],
            },
            {
                type: "actions",
                elements: [{
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Claim FD",
                        emoji: true,
                    },
                    value: "click_me_123",
                    action_id: "claim_fd",
                }, ],
            },
        ],
        text: `hungry?`,
    });
});

app.message(`export`, async ({ context, say }) => {
  var combinedMeals = claimedMeals.concat(avaidMotd.concat(avaidSotd).concat(avaidSotd));

  if (combinedMeals.length > 0) {
    var readableString = JSON.stringify(combinedMeals, null, 2);
    await say(readableString);
  } else {
    await say("Nothing to export");
  }
  
});

app.message(/^(hi|hello|hey).*/, async({ context, say }) => {
    // RegExp matches are inside of context.matches
    const greeting = context.matches[0];

    await say(`${greeting}, how are you?`);
});

// MARK: Commands

app.command("donate", async({ event, say }) => {
    await say({
        blocks: [{
                type: "actions",
                elements: [{
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Donate MOTD",
                        emoji: true,
                    },
                    value: "click_me_123",
                    action_id: "donate_motd",
                }, ],
            },
            {
                type: "actions",
                elements: [{
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Donate SOTD",
                        emoji: true,
                    },
                    value: "click_me_123",
                    action_id: "donate_sotd",
                }, ],
            },
            {
                type: "actions",
                elements: [{
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Donate FD",
                        emoji: true,
                    },
                    value: "click_me_123",
                    action_id: "donate_fd",
                }, ],
            },
        ],
        text: `hungry?`,
    });
});

// MARK: Events

app.event("app_home_opened", ({ event, say }) => {
  if (!hasSeenMessageToday) {
    hasSeenMessageToday = true;
    say({
      blocks: [{
              type: "actions",
              elements: [{
                  type: "button",
                  text: {
                      type: "plain_text",
                      text: "Feed the hungry",
                      emoji: true,
                  },
                  value: "click_me_123",
                  action_id: "actionFeed",
              }, ],
          },
          {
              type: "actions",
              elements: [{
                  type: "button",
                  text: {
                      type: "plain_text",
                      text: "I am the hungry",
                      emoji: true,
                  },
                  value: "click_me_123",
                  action_id: "actionEat",
              }, ],
          },
      ],
      text: `hungry?`,
  });
  } 
 
});

(async() => {
    // Start your app
    await app.start();
    console.log("Port", process.env.PORT);
    console.log("⚡️ Bolt app is running!");
})();