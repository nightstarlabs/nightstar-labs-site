/* stack section — Vue 3 app */
(function () {
  if (!window.Vue) return;
  var groups = {
    frontend:  ["HTML / CSS / JS", "React", "Vue", "Angular", "Material UI", "Bootstrap"],
    backend:   ["Node.js", "PHP", "Python", "Ruby on Rails", "ASP.NET", "Java", "Redis"],
    databases: ["::sql", "MSSQL", "MySQL", "PostgreSQL", "::nosql", "MongoDB", "CouchDB", "Cassandra", "Elasticsearch", "::graph", "Neo4j", "ArangoDB"],
    devops:    ["Docker", "GitHub Actions", "Terraform", "AWS", "Linux", "Nginx"]
  };
  Vue.createApp({
    data: function () { return { cats: Object.keys(groups), active: "frontend", groups: groups }; }
  }).mount("#stack-app");
})();
