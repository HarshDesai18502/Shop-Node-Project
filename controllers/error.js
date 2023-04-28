// For incorrect Url
exports.pageNotFound = (req, res) => {
  res.status(404);
  res.render('page-not-found', {
    pageTitle: 'Page Not Found',
    isLoggedIn: req.session.isLoggedIn
  });
};

// If any error occurs 
exports.get500 = (req, res) => {
  res.status(500).render('500', {
    pageTitle: 'Error!',
    isLoggedIn: req.session.isLoggedIn
  });
};
