import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';

// ============ Global state ======================
// Search object
//Current recipe object
//Shopping list object
//liked recipes

const state = {};

// ================== Search Controller

const controlSearch = async () => {
	//1. get query
	const query = searchView.getInput();
	if(query) {
		//2. new search object and add state
		state.search = new Search(query);
		//3. prepare UI for search
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);
		try {
			//4.search for recipes
			await state.search.getResults();
			//5. render results on UI
			
			searchView.renderResults(state.search.result);
		} catch(error) {
			console.log(error);
		}
		clearLoader();
	}
}

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
	if(btn) {
		const goToPage = parseInt(btn.dataset.goto);
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
	}
});

// ==================== Recipe controller

const controlRecipe = async () => {
	//Get id from the URL
	const id = window.location.hash.replace('#', '');

	if(id) {
		//prepare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		if(state.search) searchView.highLightSelector(id);

		// Create new recipe object
		state.recipe = new Recipe(id);

		try {
				//get recipe data
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();

			//calc servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();
			//render recipe
			clearLoader();
			recipeView.renderRecipe(
				state.recipe,
				state.likes.isLiked(id)
			);
		} catch(error) {
			alert(error);
		}
		
	}
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//List controller

const controlList = () => {
	//create new list if there is none yet
	if(!state.list) state.list = new List();

	//add ingredients to the list
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	})
}

//hendle delete and update list item event

elements.shopping.addEventListener('click', e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;
	//handle delete
	if(e.target.matches('.shopping__delete, .shopping__delete *')) {
		state.list.deleteItem(id);
		listView.deleteItem(id);
		//handle count
	} else if(e.target.matches('.shopping__count-value')) {
		const val = parseFloat(e.target.value);
		state.list.updateCount(id, val);
	}
});

// Likes controller

const controlLike= () => {
	if(!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;
	//not liked yet
	if(!state.likes.isLiked(currentID)) {
		//add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
		);

		//toggle the like button 
		likesView.toggleLikeBtn(true);
		//add like to UI list
		likesView.renderLike(newLike);

	// already liked
	} else {
		//remove like from the state
		state.likes.deleteLike(currentID);
		//toggle the like button 
		likesView.toggleLikeBtn(false);
		//remove like from UI list
		likesView.deleteLike(currentID);

	}
	likesView.toggleLikesMenu(state.likes.getNumLikes());
}

//restore likes recipes on page load

window.addEventListener('load', () => {
	state.likes = new Likes();
	//restore likes 
	state.likes.readStorage();
	//toggle buttons
	likesView.toggleLikesMenu(state.likes.getNumLikes()); 
	//render existing like
	state.likes.likes.forEach(like => likesView.renderLike(like));
});

//handling recipe btn click
elements.recipe.addEventListener('click', e => {
	if(e.target.matches('.btn-decrease, .btn-decrease *')) {
		if(state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}	
	} else if (e.target.matches('.btn-increase, .btn-increase *')) {
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);
	} else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
		//add ingredients to the shopping list
		controlList();
	} else if (e.target.matches('.recipe__love, .recipe__love *')) {
		controlLike();
	}
});
