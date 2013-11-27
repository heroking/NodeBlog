var Article = require("../Model/Article.js"),
	User = require("../Model/User.js"),
	Comment = require("../Model/Comment.js"),
	Admire = require("../Model/Admire.js"),
	Bookmark = require("../Model/Bookmark.js"),
	Tag = require("../Model/Tag.js"),
	async = require("async"),
	markdown = require("markdown").markdown,
	moment = require("moment");

exports.writePage = function(req, res) {
	res.render("writeArticle");
};

exports.editPage = function(req, res) {
	Article.get(req.query.articleId, function(err, article) {
		if (err) {
			return res.render("error", {
				message: err.message
			});
		}
		if (article) {
			return res.render("editArticle", {
				article: article
			});
		}
	});
};

exports.updateArticle = function(req, res) {
	Article.get(req.body.articleId, function(err, article) {
		if (err) return res.json(500, {
			message: err.message
		});
		article.title = req.body.title;
		article.content = req.body.content;
		article.tags = JSON.parse(req.body.tags);
		article.update(function(err) {
			if (err) return res.json(500, {
				message: err.message
			});
			res.json("editArticle", {
				success: true
			});
		});
	});
};

exports.saveArticle = function(req, res) {
	console.log(req.body.tags);
	var article = new Article({
		writer: req.session.user.username,
		content: req.body.content,
		title: req.body.title,
		tags: JSON.parse(req.body.tags)
	});
	article.save(function(err, art) {
		if (err) return res.render("err", {
			message: "保存文章失败"
		});
		res.redirect("/article_load?articleId=" + art.id);
	});
};

exports.deleteArticle = function(req, res) {
	Article.get(req.query.articleId, function(err, article) {
		if (err) return res.json(500, {
			message: err.message
		});
		article.remove(function(err) {
			if (err) return res.json(500, {
				message: err.message
			});
			res.json({
				success: true
			});
		});
	});
};

exports.loadArticle = function(req, res) {
	Article.get(req.query.articleId, function(err, article) {
		if (err) return res.render("error", {
			message: err.message
		});
		article.content = markdown.toHTML(article.content);
		article.writeTime = moment(article.writeTime).format("YYYY年MM月DD日");
		res.render("articleDetail", {
			article: article
		});
	});
};

exports.listArticlesByPage = function(req, res) {
	var page = (req.query.page || 1) - 1,
		artPerPage = req.query.artPerPage || 10;
	async.waterfall([

		function(callback) {
			Article.getByPage(page, artPerPage, function(err, articles) {
				if (err) return callback(err);
				callback(err, articles);
			});
		},
		function(articles, callback) {
			async.map(articles, function(article, callback) {
				User.get(article.writer, function(err, user) {
					if (err) return callback(err);
					article.writer = user;
					callback(err, article);
				});
			}, function(err, articles) {
				if (err) return callback(err);
				callback(err, articles);
			});
		},
		function(articles, callback) {
			Article.countAll(function(err, total) {
				if (err) return callback(err);
				callback(err, articles, total);
			});
		}
	], function(err, articles, total) {
		var i,
			totalPage,
			curPage,
			startPage,
			endPage;
		if (err) return res.render("error", {
			message: "获取文章列表时发生错误..."
		});
		for (i = articles.length; i--;) {
			articles[i].content = markdown.toHTML(articles[i].content);
			articles[i].writeTime = moment(articles[i].writeTime).format("YYYY年MM月DD日");
		}
		totalPage = Math.ceil(total / artPerPage);
		curPage = page + 1;

		if (curPage <= 2) {
			startPage = 1;
			endPage = totalPage >= 5 ? 5 : totalPage;
		} else if (curPage >= totalPage - 2) {
			endPage = totalPage;
			startPage = totalPage >= 5 ? totalPage - 4 : 1;
		} else {
			startPage = curPage - 2;
			endPage = curPage + 2;
		}
		res.render("listArticle", {
			articles: articles,
			curPage: page + 1,
			artPerPage: artPerPage,
			totalPage: totalPage,
			startPage: startPage,
			endPage: endPage
		});
	});
};