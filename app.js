const express    = require("express"),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// DB connection
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

// Set up Schema
const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Set up Model
const Item = mongoose.model("item", itemsSchema);
const List = mongoose.model("list", listSchema);

// Create sample items
const item1 = new Item({name: "iPhone SE"});
const item2 = new Item({name: "Apple Watch"});
const item3 = new Item({name: "MacBook Pro"});

const defaultItems = [item1, item2, item3];


// Routes
app.get("/", function(req, res) {
  Item.find({}, function(err, items){
    if (items.length === 0) {
      // Insert default items to DB
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Insert successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newItems: items
      });
    }
  });
});

app.get("/:toDoList", function(req, res){
  const toDoName = _.capitalize(req.params.toDoList);
  List.findOne({name: toDoName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: toDoName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + toDoName);
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newItems: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItem = req.body.delItem;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Item remove successfully!");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {items: {_id: checkedItem}}
    }, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});


// Listen to the port request
app.listen(3000, function() {
  console.log("Server started on port 3000...");
});
