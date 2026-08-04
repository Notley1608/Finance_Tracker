import app from "./app"

const port = Bun.env.PORT || 3000;
app.listen(port);
console.log(`Listening on port ${app.server?.port}...`)