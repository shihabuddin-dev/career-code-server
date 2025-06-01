const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);

// Middleware
app.use(cors());
app.use(express.json());

// mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r0dgoug.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// verify firebase token

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unAuthorized access" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ message: "unAuthorized access" });
  }
};

// verify token email (reuseable middleware)
const verifyTokenEmail = (req, res, next) => {
  if (req.query.email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

async function run() {
  try {
    // await client.connect();
    const jobsCollection = client.db("careerCodeDB").collection("jobs");
    const applicationsCollection = client
      .db("careerCodeDB")
      .collection("applications");

    // jobs api
    app.get("/jobs", async (req, res) => {
      // getting posted jobs using email
      const email = req.query.email;
      const query = {};
      if (email) {
        query.hr_email = email;
      }

      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    // matching job
    app.get(
      "/jobs/applications",
      verifyFirebaseToken,
      verifyTokenEmail,
      async (req, res) => {
        const email = req.query.email;

        const query = { hr_email: email };
        const jobs = await jobsCollection.find(query).toArray();

        // should use aggregate to have optimum data fetching
        for (const job of jobs) {
          const applicationQuery = { jobId: job._id.toString() };
          const application_count = await applicationsCollection.countDocuments(
            applicationQuery
          );
          job.application_count = application_count;
        }
        res.send(jobs);
      }
    );

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(filter);
      res.send(result);
    });
    // adding jobs from client site
    app.post("/jobs", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });

    // **applications**
    // get application data by email (data loading by using query)
    app.get(
      "/applications",
      verifyFirebaseToken,
      verifyTokenEmail,
      async (req, res) => {
        const email = req.query.email;

        const query = { applicant: email };
        const result = await applicationsCollection.find(query).toArray();

        // bad way to aggregate data
        for (const application of result) {
          const jobId = application.jobId;
          const jobQuery = { _id: new ObjectId(jobId) };
          const job = await jobsCollection.findOne(jobQuery);
          application.company = job.company;
          application.title = job.title;
          application.company_logo = job.company_logo;
        }
        res.send(result);
      }
    );

    //get single application using id
    app.get("/applications/job/:job_id", async (req, res) => {
      const job_id = req.params.job_id;
      const query = { jobId: job_id };
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });
    // applicationsCollection post from client site
    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.send(result);
    });

    //update applications
    app.patch("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: { status: req.body.status },
      };
      const result = await applicationsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // delete applications
    app.delete("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await applicationsCollection.deleteOne(filter);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("That's great! Server is running");
});

app.listen(port, (req, res) => {
  console.log(`Server is running on port http://localhost:${port}`);
});
