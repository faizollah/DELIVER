const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const indexRouter = require('./app/routes/index.router');
const analysisRouter = require('./app/routes/analysis.router');
const dbService = require('./app/services/database.service');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', indexRouter);
app.use('/', analysisRouter);

dbService.ensureTableExists().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});
