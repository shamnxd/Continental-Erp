import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.continental.adminerp",
  appName: "Continental Admin ERP",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
