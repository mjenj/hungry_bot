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
// console.log(c);

console.log(availableOptionGenerator())

  function availableOptionGenerator() {
	var avaidFd = ['a','b'];
	var fd = avaidFd.length;
	  var motd = avaidFd.length;
	  var sotd = avaidFd.length;
	  var unknown = avaidFd.length;
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
	var final = ({
	  options: options
	})
  
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