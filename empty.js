var a = `
{
	"meal": [
		{
			"owner": "userID",
			"claimer": "userID",
			"type": "MOTD",
			"timeIn": "00:00",
			"timeOut": "00:00"
		},
		{
			"owner": "userID",
			"claimer": "userID",
			"type": "SOTD",
			"timeIn": "00:00",
			"timeOut": "00:00"
		}
	]
}`;

var arr = JSON.parse(a);
var b = JSON.stringify(arr);
// console.log(b);

var fdMeal = [];
var claimedMeals = [];

fdMeal.push({
    owner: "jeff",
    type: "Fd",
    time: new Date()
})

var meal = fdMeal.shift();
meal["claimer"] = "Bob";
meal["timeOut"] = new Date();
claimedMeals.push(meal);

var c = JSON.stringify(claimedMeals, null, 2)
console.log(c);