/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	user = require('./routes/Actions/UserAction.js'),
	article = require('./routes/Actions/ArticleAction.js'),
	comment = require('./routes/Actions/CommentAction.js'),
	admire = require('./routes/Actions/AdmireAction.js'),
	bookmark = require('./routes/Actions/BookmarkAction.js'),
	http = require('http'),
	path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('wly'));
app.use(express.session({
	secret: "lingyucoder"
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
	if (req.path !== "/user_logout") {
		if (req.session.user) {
			res.locals({
				user: req.session.user
			});
		} else {
			if (req.path !== "/user_loginPage" && req.path !== "/user_login" && req.path !== "/error") {
				req.session.lastPage = req.originalUrl;
			}
		}
	} else {
		res.locals({
			user: null
		});
	}
	next();
});

app.use('/nor/', function(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		return res.render("login", {
			message: "请登录后进行该操作..."
		});
	}
});

app.use('/nor/conf/', function(req, res, next) {
	console.log(req.session.user);
	if (req.session.user && req.session.user.owner) {
		next();
	} else {
		return res.render("error", {
			message: "该操作需要管理员权限"
		});
	}
});
app.use(app.router);
// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}



app.get('/', routes.index);
app.get('/index', routes.index);
app.get('/nor/userCenter', routes.userCenter);

app.get('/user_loginPage', user.loginPage);
app.get('/user_registPage', user.registPage);
app.get('/nor/user_detail', user.loadDetail);
app.get('/user_getDetail', user.getDetail);
app.post('/user_regist', user.regist);
app.post('/user_login', user.login);
app.post('/nor/user_modify', user.modify);
app.get('/user_logout', user.logout);
app.get('/nor/conf/article_write', article.writePage);
app.get('/nor/conf/article_edit', article.editPage);
app.get('/nor/conf/article_delete', article.deleteArticle);
app.get('/article_load', article.loadArticle);
app.post('/nor/conf/article_save', article.saveArticle);
app.post('/nor/conf/article_update', article.updateArticle);
app.get('/article_list', article.listArticlesByPage);
app.get('/comment_listByArticle', comment.listByArticle);
app.post('/nor/comment_addComment', comment.save);
app.get('/nor/comment_delete', comment.remove);
app.get('/nor/admire_addAdmire', admire.addAdmire);
app.get('/nor/admire_removeAdmire', admire.removeAdmire);
app.get('/nor/bookmark_addBookmark', bookmark.save);
app.get('/nor/bookmark_removeBookmark', bookmark.remove);

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});