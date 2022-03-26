export default class MealService {

    constructor() {
        this.meals = [];
        this.claimedMeals = [];
    }

    DonateMeal(meal) {
        this.meals.push(meal);
    }

    ClaimMeal(mealType, user, claimTime) {
        var mealIndex = this.meals.findIndex(e => {
            return e.mealType == mealType;
        });

        if (mealIndex) {
            return assignMeal(mealIndex, user, claimTime);
        }
        return null;
    }

    ClaimRandomMeal(user, claimTime) {
        if (this.meals.length > 0) {
            return assignMeal(0, user, claimTime);
        }
        return null;
    }

    GetAvaidableMeals() {
        var avaidMotd = this.meals.filter(function (el) {
            return el.mealType == "motd";
        }).length ?? 0;
        var avaidSotd = this.meals.filter(function (el) {
            return el.mealType == "sotd";
        }).length ?? 0;
        var avaidFd = this.meals.filter(function (el) {
            return el.mealType == "fd";
        }).length ?? 0;
        var avaidUnk = this.meals.filter(function (el) {
            return el.mealType == "unk";
        }).length ?? 0;

        return {
            avaidMotd: avaidMotd,
            avaidSotd: avaidSotd,
            avaidFd: avaidFd,
            avaidUnk: avaidUnk
        }
    }

    GetMeals() {
        return new {
            claimedMeals: this.claimedMeals,
            unclaimedMeals: this.meals
        };
    }

    ClearMeals() {
        this.meals = [];
        this.claimedMeals = [];
    }

    #assignMeal(mealIndex, user, claimTime) {
        var meal = this.meals[mealIndex];
        this.meals.splice(index, 1);
        meal["claimer"] = user.id;
        meal["claimerName"] = `<@${body.user.id}>`,
        meal["timeOut"] = claimTime;
        this.claimedMeals.push(meal);
        return meal;
    }

    #filterByType(el, type) {
        return (el.mealType == type)
    }
}