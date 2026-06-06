import mongoose from "mongoose";

class DbConnection {
  static MAX_RETRIES = 3;
  static RETRY_INTERVAL = 5000; // 5 sec

  private isConnected: boolean;
  private retryCount: number;
  private _closing: boolean;

  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this._closing = false;

    mongoose.connection.on("connected", () => {
      this.retryCount = 0;
      this.isConnected = true;
      console.log("MONGODB CONNECTED");
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      console.log("MONGODB DISCONNECTED");
      if (!this._closing) {
        this.handleReconnection();
      }
    });

    mongoose.connection.on("error", (err: Error) => {
      this.isConnected = false;
      console.log("ERROR: ERROR OCCURRED CONNECTING MONGODB", err);
    });

    process.on("SIGTERM", this.handleAppTermination.bind(this));
    process.on("SIGINT", this.handleAppTermination.bind(this));
  }

  async connect() {
    if (mongoose.connection.readyState === 1) {
      console.log("MONGODB ALREADY CONNECTED");
      return;
    }
    try {
      const MONGO_URI = process.env.MONGO_URI;
      if (!MONGO_URI) {
        throw new Error("MONGO_URI missing");
      }

      const configOptions: mongoose.ConnectOptions = {
        family: 4,
        maxPoolSize: 10,
        //defaults
        // serverSelectionTimeoutMS: 30000, //30 sec
        // socketTimeoutMS: 10000, //10sec
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
      };

      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }

      await mongoose.connect(MONGO_URI, configOptions);
      console.log("MONGODB CONNECTED SUCCESSFULLY");
    } catch (err) {
      await this.handleReconnection();

      if (!this.isConnected) {
        console.log("Error :", err);
      }
    }
  }

  async handleReconnection() {
    if (this.retryCount >= DbConnection.MAX_RETRIES || this._closing) {
      console.log("FAILED TO RECONNECT WITH MONGODB");
      return;
    }

    this.retryCount++;
    console.log(
      `Retrying connection... (${this.retryCount}/${DbConnection.MAX_RETRIES})`,
    );
    await new Promise((resolve) =>
      setTimeout(resolve, DbConnection.RETRY_INTERVAL),
    );

    await this.connect();
  }

  async handleAppTermination() {
    if (this._closing) return;
    this._closing = true;
    try {
      await mongoose.connection.close();
      console.log("MONGODB CONNECTION TERMINATED");
      process.exit(0);
    } catch (err) {
      console.log("ERROR: TERMINATING CONNECTION");
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

const dbConnection = new DbConnection();

export default dbConnection.connect.bind(dbConnection);
export const connectionStatus =
  dbConnection.getConnectionStatus.bind(dbConnection);
