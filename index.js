const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://doccare-7847e.firebaseapp.com"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
const uri = `mongodb+srv://mdimamcse9bu:${process.env.PASS}@cluster0.zqhrd3x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const services = await client.db("services").collection("services");
    const doctors = await client.db("services").collection("doctors");
    const bookedServices = await client
      .db("services")
      .collection("bookedServices");

    app.post("/addService", async (req, res) => {
      try {
        const newService = req.body;
        const result = await services.insertOne(newService);
        res.send(result);
      } catch (error) {
        console.error("Error adding   item:", error);
        res.status(500).json({ error: "Failed to add   item" });
      }
    });
    app.post("/bookService", async (req, res) => {
      try {
        const newService = req.body;
        const result = await bookedServices.insertOne(newService);
        res.send(result);
      } catch (error) {
        console.error("Error adding   item:", error);
        res.status(500).json({ error: "Failed to add   item" });
      }
    });
    app.get("/services", async (req, res) => {
      const cursor = services.find({});
      const results = await cursor.toArray();
      res.json(results);
    });
    app.get("/doctors", async (req, res) => {
      const cursor = doctors.find({});
      const results = await cursor.toArray();
      res.json(results);
    });
    app.get("/docProfile/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await doctors.findOne(query);
      res.json(result);
    });

    app.get("/myServices", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = {
          user_email: req.query.email,
        };
      }
      const results = await services.find(query).toArray();
      res.json(results);
    });
    app.get("/bookedServices", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = {
          userEmail: req.query.email,
        };
      }
      const results = await bookedServices.find(query).toArray();
      res.json(results);
    });

    app.get("/todoservice", async (req, res) => {
      let email = req.query.email;

      const Allservices = services.find({});
      const servicesArray = await Allservices.toArray();
      const bookedServicesArray = await bookedServices.find({}).toArray();

      const result = bookedServicesArray.filter((bookedService) => {
        const bookedServiceId = bookedService.serviceID.toString();
        return servicesArray.some((service) => {
          const servicesId = service._id.toString();

          return bookedServiceId === servicesId;
        });
      });
      const finalResult = result.filter((service) => {
        return service.providerEmail === email;
      });

      res.json(finalResult);
    });

    app.patch("/updateServiceState/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          state: req.body.state,
        },
      };
      const result = await services.updateOne(query, updateDoc);
      const newres = await bookedServices.updateOne(query, updateDoc);
      res.json(newres);
    });

    app.delete("/deleteService/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await services.deleteOne(query);
      res.json(result);
    });

    app.delete("/deleteBookedService/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const query = { _id: new ObjectId(id) };
        const result = await bookedServices.deleteOne(query);
        if (result.deletedCount === 1) {
          res.json({ success: true, message: "Service deleted successfully" });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Service not found" });
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.patch("/updateService/:id", async (req, res) => {
      const id = req.params.id;

      const {
        item_name,
        price,
        short_description,
        image,
        service_area,
        provider_image,
        user_email,
        user_name,
      } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          item_name: item_name,
          price: price,
          short_description: short_description,
          image: image,
          service_area: service_area,
          provider_image: provider_image,
          user_email: user_email,
          user_name: user_name,
        },
      };

      const result = await services.updateOne(query, updateDoc);
      res.json(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await services.findOne(query);

      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
