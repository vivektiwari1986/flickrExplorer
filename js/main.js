$(function() {

	var ImageModel = Backbone.Model.extend({});

	var ImageColl = Backbone.Collection.extend({
		url : 'http://api.flickr.com/services/feeds/photos_public.gne',
		sync : function(method, model, options) {
			options.timeout = 10000;
			options.dataType = "jsonp";
			return Backbone.sync(method, model, options);
		},
		model : ImageModel,

		initialize : function() {
		}
	});

	var ImageCollFriends = Backbone.Collection.extend({
		url : 'http://api.flickr.com/services/feeds/photos_friends.gne',
		sync : function(method, model, options) {
			options.timeout = 10000;
			options.dataType = "jsonp";
			return Backbone.sync(method, model, options);
		},
		model : ImageModel,

		initialize : function() {
		}
	});

	var ListView = Backbone.View.extend({
		el : $("#page"),
		template : _.template($('#list-template').html()),
		initialize : function(options) {
			this.model.bind("reset", this.render, this);
			this.viewType = options.viewType;
			this.authorId = options.authorId;
			var self = this;
			this.model.bind("add", function(image) {
				$('#list').append(new ListItemView({
					model : image,
					viewType : self.viewType
				}).render().el);
			});
		},
		render : function() {
			var compiledTemplate = _.template($('#list-template').html(), {
				user : "1",
				viewType : this.viewType,
				authorId : this.authorId
			});
			$(this.el).html(compiledTemplate);
			var self = this;
			_.each(this.model.models, function(image) {
				$('#list').append(new ListItemView({
					model : image,
					viewType : self.viewType
				}).render().el);
			}, this);
		},
		noImageFound : function() {
			$('.no-pics').removeClass("hidden");
		}
	});

	var ListItemView = Backbone.View.extend({
		initialize : function(options) {
			this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);
			this.viewType = options.viewType;
		},
		render : function(eventName) {
			var data = {
				model : this.model,
				_ : _,
				viewType : this.viewType
			};
			var compiledTemplate = _.template($('#item-template').html(), data);
			$(this.el).html(compiledTemplate);
			return this;
		},
		close : function() {
			$(this.el).unbind();
			$(this.el).remove();
			this.model.unbind("change", this.render);
		}
	});

	var AppRouter = Backbone.Router.extend({
		routes : {
			'' : 'showHome',
			'user/:id' : 'user',
			'friends/:id' : 'friends'
		}
	});

	var initialize = function() {
		var app_router = new AppRouter;

		app_router.on('route:showHome', function() {
			window.imageList = new ImageColl();
			window.publicImageView = new ListView({
				model : window.imageList,
				viewType : 'home'
			});
			window.publicImageView.render();
			window.imageList.fetch({
				data : {
					'format' : 'json'
				}
			});
		});

		app_router.on('route:user', function(id) {
			window.imageList = new ImageColl();
			window.publicImageView = new ListView({
				model : window.imageList,
				viewType : 'user',
				authorId : id
			});
			window.publicImageView.render();
			window.imageList.fetch({
				data : {
					'format' : 'json',
					'id' : id
				}
			});
		});

		app_router.on('route:friends', function(id) {
			window.imageList = new ImageCollFriends();
			window.publicImageView = new ListView({
				model : window.imageList,
				viewType : 'friends'
			});
			window.publicImageView.render();
			window.imageList.fetch({
				data : {
					'format' : 'json',
					'user_id' : id,
					'friends' : 1,
					'display_all' : 1
				}
			});
		});

		window.app_router = app_router;

		Backbone.history.start();
	};
	initialize();
});
function jsonFlickrFeed(res) {
	if(res.items.length == 0) {
		window.publicImageView.noImageFound();
	} else {
		res.items.forEach(function(item) {
			var tksId = item.link.split("/");
			var tksName = item.author.split("(");
			item.id = tksId[tksId.length - 2];
			var name = tksName[tksName.length - 1];
			item.authorName = name.length > 12 ? name.substring(0, 11) + ".." : name.slice(0, -1);
		});
		window.imageList.reset(res.items);
	}

}