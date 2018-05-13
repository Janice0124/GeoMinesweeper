// Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
var dom = {};

var numClicks = 0;
var boardSize = 500;

// Mining Tools
var tools = [
	{
		"name": "Pan",
		"description": "Place river gravel into a shallow pan then add water. Swirl the pan around until the gravel spills over the side and the gold dust is sitting at the bottom just waiting for you!",
		"img": "img/tools/pan.jpg",
		"depth": "0-5m",
		"profit": "$25",
		"price": "free",
		"available": "01/1847",
		"locations": "rivers"
	},
	{
		"name": "Rocker",
		"description": "Dump dirt and rock at the top of your Rocker and just rock that baby back and forth until you see gold at the bottom of the box.",
		"img": "img/tools/rocker.jpg",
		"depth": "0-5m",
		"profit": "$40",
		"price": "$50",
		"available": "01/1848",
		"locations": "anywhere"
	},
	{
		"name": "Long Tom",
		"description": "Dump your dirt, rocks, and gravel at the top of the Long Tom. Then watch those rocks fall 20 feet down to your cradle. Collect gold, rinse, repeat. You’re gonna need a couple extra hands for this big guy.",
		"img": "img/tools/longtom.jpg",
		"depth": "0-5m",
		"profit": "$60",
		"price": "$80",
		"available": "01/1849",
		"locations": "within 2 squares of a water source, on land or water"
	},
	{
		"name": "Dredger",
		"description": "Get your dredger and you can get all the way to the bottom of the river without your scuba gear. The dredger works best in deeper rivers.",
		"img": "img/tools/dredger.jpg",
		"depth": "0-30m",
		"profit": "$100",
		"price": "$130",
		"available": "01/1850",
		"locations": "rivers"
	},
	{
		"name": "Hydraulic Mining",
		"description": "Hold onto your hats because she’s gonna make a mess! You’ll need to have a lot of water on hand along with a hose. Just aim at anything on land and reap those golden rewards.",
		"img": "img/tools/hydraulic.jpg",
		"depth": "0-15m",
		"profit": "$150",
		"price": "$200",
		"available": "01/1851",
		"locations": "within 5 squares of a water source, but only on land"
	},
	{
		"name": "Hardrock Miner",
		"description": "This piece of equipment is every miner’s dream. Crush any piece of rock, dirt, or gravel and see what goodies lie inside.",
		"img": "img/tools/hardrock.jpg",
		"depth": "0-50m",
		"profit": "$300",
		"price": "$500",
		"available": "01/1853",
		"locations": "any land"
	},

]

// Month/years
var months = ["January", "February","March","April","May","June",
							"July","August","September","October","November","December"]
var monthCounter=0;
var yearCounter = 1847;

// Variables that are used in the game
var money = 0;
var inventory = ["Gold Pan"];
var numWorkers = 0;
var workerTimer = 0;
var lastMonthLog = [];
var goldPanCoordinates = {
	"b2": 1,
	"b3": 2,
	"b5": 4,
	"c5": 1,
	"f3": 1,
	"g5": 7,
	"h1": 3,
	"h2": 3,
};

var goldMineCoordinates = {
	"a1": [5,12],
	"b1": [5,12],
	"c2": [30,12],
	"d4": [5,12],
	"f2": [2,12],
	"g1": [2,12],
	"g2": [20,12],
	"g3": [10,12],
	"h3": [10,12],
};

// ================================================
// EVENTS
// ================================================

// Attaching events on document because then we can do it without waiting for
// the DOM to be ready (i.e. before DOMContentLoaded fires)
Util.events(document, {
	// Final initalization entry point: the Javascript code inside this block
	// runs at the end of start-up when the DOM is ready
	"DOMContentLoaded": function() {
		var boardDiv = document.getElementById("boardDiv");
		boardDiv.style.setProperty("--size", size);
		// createImage("tcolormap.png", 1860, 1292, boardSize);

		Util.one("#coordinates").focus();
		Util.one("#inventory").innerHTML = "" + inventory[0];

		populateStoreLegend();
		setUpGeneralStore();
		setUpPopups();

		//Util.one("#storyboard-popup").style.display = "block";

		// EVENT: input listens for change in input (typing, copy/paste, etc)
		var coordInput = Util.all(".coordinates");
		for (i of coordInput) {
			i.addEventListener("input", function(event) {
			  // check if current value is valid (in the form "a1", "h8", "j10", etc.)
				// then change outline color to signify correct/incorrect
				var currentInput = this.value;
				var pattern = new RegExp(this.pattern);
				if (pattern.test(currentInput)){
				    this.setAttribute("style","outline-color: green;"); // green outline (as opposed to red)
				}
				else {
				    this.setAttribute("style","outline-color: red;"); // red outline (as opposed to none)
				}
			});
		}

		// EVENT: Completes all actions for the current month
		//				Calculates earnings, subtracts spendings, moves forward 1 month
		Util.one("#submit-month").onclick = function() {
			display(".hint",false); // turn off previous hints
			var earnings = []; // keep track of [location, action, money] to display later

			// find location/action for you and each hired worker (if any), calulate earnings
			var allWorkers = Util.all(".location-action");
			for (i of allWorkers) {
				var location = i.querySelector(".location").querySelector(".coordinates").value.toLowerCase();
				var actionType;
				var actionDiv = i.querySelector(".action");
				if (actionDiv.querySelector(".action-pan").checked == true) {
					actionType = "pan";
				}
				else if (actionDiv.querySelector(".action-mine").checked == true) {
					actionType = "mine";
				}
				var profit = calculateEarnings(location, actionType)
				money += profit;

				earnings.push([location, actionType, profit]);
			}
			lastMonth = earnings;

			// display new money amount
			console.log("You earned: $" + money);
			Util.one("#current-money").innerHTML = "$" + money;
			// display the last month log (breakdown of location/action/profit)
			var lastMonthDiv = Util.one("#last-month");
			lastMonthDiv.innerHTML = "";
			for (i of lastMonth) {
				// i = [location, actionType, profit]
				var line = document.createElement("p");
				line.innerHTML = "$" + i[2] + " from location " + i[0] + " using " + i[1];
				lastMonthDiv.appendChild(line);
			}
			// reset location coordinate input, refocus
			var coordInput = Util.all(".coordinates");
			Util.one("#coordinates").focus();

			// check if workers are done (finished 12 months)
			// if so, reset number of workers hired. else decrement timer
			if (workerTimer <= 0){
				numWorkers = 0;
				var hiredWorkers = Util.all(".worker-actions");
				while(hiredWorkers.length > 0) {
					// removing location/action selectors of the hired workers
					hiredWorkers[0].parentNode.removeChild(hiredWorkers[0]);
					hiredWorkers = Util.all(".worker-actions");
				}
				Util.one("#num-workers").innerHTML = "0";
				Util.one("#buy-worker").disabled = false;
			}
			else {
				workerTimer -= 1;
			}
			// increase time 1 month forward
			if (monthCounter==11) { // aka December
				yearCounter += 1;
			}
			monthCounter = (monthCounter+1) % 12;
			Util.one("#date").innerHTML = ""+months[monthCounter]+" "+yearCounter;

			// check if it's the right date for new tool
			// Jan 1848 -- add rocker tool
			if (yearCounter == 1848) {
				Util.one("#rocker-text").hidden = false;
				Util.one("#buy-mine").hidden = false;
			}
		}

	},



	// Keyboard events arrive here
	"keydown": function(evt) {
	},

	// Click events arrive here
	"click": function(evt) {

	}
});

function populateStoreLegend() {
	var legend = Util.one("#store-popup");
	var listing = Util.one("#items-list");
	tools.forEach((tool) => {
		var name = document.createElement("div");
		name.innerHTML = tool.name;
		listing.appendChild(name);

		var description = document.createElement("div");
		description.innerHTML = tool.description;
		listing.appendChild(description);

		var depth = document.createElement("div");
		depth.innerHTML = tool.depth;
		listing.appendChild(depth);

		var profit = document.createElement("div");
		profit.innerHTML = tool.profit;
		listing.appendChild(profit);

		var price = document.createElement("div");
		price.innerHTML = tool.price;
		listing.appendChild(price);

		var available = document.createElement("div");
		available.innerHTML = tool.available;
		listing.appendChild(available);

		var locations = document.createElement("div");
		locations.innerHTML = tool.locations;
		listing.appendChild(locations);

		var imageDiv = document.createElement("div");
		var img = document.createElement("img");
		img.src = tool.img;
		img.style.width = "100px";
		imageDiv.appendChild(img);
		listing.appendChild(imageDiv);

	})
}


function setUpGeneralStore() {
		// Button - buying mining tools
	Util.one("#buy-mine").onclick = function() {
		if (money >= 50 && inventory.indexOf("Rocker (Mining Tool)") < 0){
			// buy the tools, add to inventory
			money -= 50;
			inventory.push("Rocker (Mining Tools)");
			// refresh inventory text
			var inventoryContents = "";
			for (var i = 0; i < inventory.length; i++) {
				inventoryContents += inventory[i] + ", ";
			}
			Util.one("#inventory").innerHTML = inventoryContents;
			Util.one("#current-money").innerHTML="$"+money;

			// enable all "Mine for Gold" options
			var mineOptions = Util.all(".action-mine");
			for (i of mineOptions) {
				i.disabled = false;
			}

			// disable buy mining tools button
			this.disabled = true;
		}

	}

	// Button - hire a worker
	// adds a new location/action selector for each worker hired
	Util.one("#buy-worker").onclick = function() {
		if (money >= 50){
			// hire worker, update page
			money -= 50;
			numWorkers += 1;
			workerTimer = 12; // workers stay for 12 months
			Util.one("#num-workers").innerHTML = ""+numWorkers;
			Util.one("#current-money").innerHTML="$"+money;

			// add a new location/action selector
			var outerDiv = Util.one("#user-actions");
			var selection = outerDiv.querySelector(".location-action").cloneNode(true);
			selection.classList.add("worker-actions");
			selection.querySelector(".location").children[0].innerHTML = "Worker Location:";
			outerDiv.append(selection);

			this.disabled = true; // for now, only hire 1 worker at a time
			// TODO implement hiring multiple workers correctly
		}

	}
}


function setUpPopups() {

	// Util.one("#maps-button").onclick = function() {
	// 	Util.one("#map-popup").style.display = "block";
	// }

	// Util.one("#map-popup-close").onclick = function() {
	// 	Util.one("#map-popup").style.display = "none";
	// }

	Util.one("#view-store-button").onclick = function() {
		Util.one("#store-popup").style.display = "block";
	}

	Util.one("#store-popup-close").onclick = function() {
		Util.one("#store-popup").style.display = "none";
	}

    window.onclick = function(event) {
    	// console.log(event)
      var mapPopup = Util.one("#map-popup");
      if (event.target == mapPopup) {
        mapPopup.style.display = "none";
      } else if (event.target == Util.one("#store-popup")) {
      	Util.one("#store-popup").style.display = "none";
      }
    }

}


function calculateEarnings(location, actionType) {
	var mapToUse = goldPanCoordinates;
	var earnings = 0;

	// pick the map to use
	if (actionType == "pan") {
		mapToUse = goldPanCoordinates;
		// check how much gold is in that location
		if (location in mapToUse) {
			earnings = mapToUse[location];
		}
		else {
			earnings = 0;
		}
	}
	else if (actionType == "mine") {
		mapToUse = goldMineCoordinates;
		if (location in mapToUse) {
			// check if the location is "dried up" - user can only dig 12 times total
			var usesLeft = mapToUse[location][1];
			if (usesLeft > 0){
				earnings = mapToUse[location][0];
				mapToUse[location][1] = mapToUse[location][1]-1; // decrease the "dry-up" counter
				console.log(mapToUse[location]);
			}
			else {
				display("#hint-dry", true); // display hint about drying up
				earnings = 1;
			}
		}
		else {
			earnings = 0;
		}
	}

	return earnings;
}
