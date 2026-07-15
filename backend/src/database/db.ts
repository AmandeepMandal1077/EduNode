import mongoose from "mongoose";
import debug from "../utils/debug.js";

class DbConnection {
  static MAX_RETRIES = 3;
  static RETRY_INTERVAL = 5000;

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
      debug("MONGODB CONNECTED");
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      debug("MONGODB DISCONNECTED");
      if (!this._closing) {
        this.handleReconnection();
      }
    });

    mongoose.connection.on("error", (err: Error) => {
      this.isConnected = false;
      debug("ERROR: ERROR OCCURRED CONNECTING MONGODB", err);
    });

    process.on("SIGTERM", this.handleAppTermination.bind(this));
    process.on("SIGINT", this.handleAppTermination.bind(this));
  }

  async connect() {
    if (mongoose.connection.readyState === 1) {
      debug("MONGODB ALREADY CONNECTED");
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
      };

      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }

      await mongoose.connect(MONGO_URI, configOptions);
      debug("MONGODB CONNECTED SUCCESSFULLY");
    } catch (err) {
      await this.handleReconnection();

      if (!this.isConnected) {
        debug("Error :", err);
      }
    }
  }

  async handleReconnection() {
    if (this.retryCount >= DbConnection.MAX_RETRIES || this._closing) {
      debug("FAILED TO RECONNECT WITH MONGODB");
      return;
    }

    this.retryCount++;
    debug(
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
      debug("MONGODB CONNECTION TERMINATED");
      process.exit(0);
    } catch (err) {
      debug("ERROR: TERMINATING CONNECTION");
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
