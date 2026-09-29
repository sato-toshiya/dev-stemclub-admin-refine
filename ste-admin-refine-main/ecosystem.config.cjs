module.exports = {
  apps: [
    {
      name: "ste-admin",
      cwd: "/home/ec2-user/ste-admin-refine",
      // Serve the built files in dist/ on port 5173
      script: "npx",
      args: "serve -s dist -l 5173",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
