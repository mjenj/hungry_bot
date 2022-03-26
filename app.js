import * as listener from "./listener.js";
listener.listen();

const MealService = require("./mealService.js");

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

app.action("actionFeed", async ({ body, ack, say }) => {
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
        },],
        text: "home",
    });
});

app.action("actionEat", async ({ body, ack, say }) => {
    await ack();
    // await say(`<@${body.user.id}> you lazy fuck`);
    var meals = MealService.GetAvaidableMeals();
    await say("There are " + meals.avaidMotd.length + " MOTD's, " + meals.avaidSotd.length + " SOTD's, " + meals.avaidFd.length + " FD's and " + meals.avaidUnk.length + " Lucky Packets");
    await say(availableOptionGenerator());
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
                options: availableOptionGenerator,
                action_id: "meal-type-selected-take",
            },
        },],
        text: "home",
    });
});

function availableOptionGenerator() {
    var meals = MealService.GetAvaidableMeals();
    var fd = meals.avaidFd.length;
    var motd = meals.avaidMotd.length;
    var sotd = meals.avaidSotd.length;
    var unknown = meals.avaidUknown.length;
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
    if (anyAvailable) {
        options.push({
            text: createOption("I'll take anything"),
            value: "value-any"
        })
    }

    var json = JSON.stringify(options, null, 2)
    return json.replace(/"([^"]+)":/g, '$1:');
}

function createOption(title) {
    var option = ({
        type: "plain_text",
        text: title,
        emoji: true,
    });
    return option;
}

app.action("meal-type-selected-take", async ({ body, ack, say, action }) => {
    await ack();
    // await say(`<@${body.user.id}> you lazy fuck`);
    var meal = null;
    var value = action.selected_option.value;
    if (value === 'value-motd') {
        meal = MealService.ClaimMeal("motd", body.user, action.action_ts);
    } else if (value === 'value-sotd') {
        meal = MealService.ClaimMeal("sotd", body.user, action.action_ts);
    } else if (value === 'value-fd') {
        meal = MealService.ClaimMeal("fd", body.user, action.action_ts);
    } else if (value === 'value-unknown') {
        meal = MealService.ClaimRandomMeal("unk", body.user, action.action_ts);
    } else {
        meal = MealService.ClaimRandomMeal(body.user, action.action_ts);
    }

    if (meal) {
        say(`You got a ${meal.mealType} from <@${meal.owner}>`);
    } else {
        say("Oh no! No meals available right now, try again later ");
    }
});

app.action("meal-type-selected-give", async ({ body, ack, say, action }) => {
    await ack();
    // await say(`<@${body.user.id}> you lazy fuck`);

    var meal = {
        owner: body.user.id,
        ownerName: `<@${body.user.id}>`,
        type: "",
        timeIn: action.action_ts,
        timeOut: ""
    };
    var value = action.selected_option.value;

    if (value === 'value-motd') {
        meal.type = "motd";
    } else if (value === 'value-sotd') {
        meal.type = "sotd";
    } else if (value === 'value-fd') {
        meal.type = "fd";
    } else if (value === 'value-uknown') {
        meal.type = "unk";
    }
    MealService.DonateMeal(meal);
    say("Thank you for your donation, you've saved a starving african");
});

app.message("purge", async ({ event, say }) => {
    MealService.ClearMeals();
    hasSeenMessageToday = false;
});

app.message("setPurge", async ({ event, say }) => {
    cron.schedule('0 18 * * Mon,Tue,Wed,Thu,Fri', () => {
        MealService.ClearMeals();
        hasSeenMessageToday = false;
    });
});

app.message(`export`, async ({ context, say }) => {
    var combinedMeals = MealService.GetMeals();
    var readableString = JSON.stringify(combinedMeals, null, 2);
    await say(readableString);
});

app.message(/^(hi|hello|hey).*/, async ({ context, say }) => {
    // RegExp matches are inside of context.matches
    const greeting = context.matches[0];

    await say(`${greeting}, how are you?`);
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
                },],
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
                },],
            },
            ],
            text: `hungry?`,
        });
    }

});

(async () => {
    // Start your app
    await app.start();
    console.log("Port", process.env.PORT);
    console.log("⚡️ Bolt app is running!");
})();