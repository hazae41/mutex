import { assert, test } from "@hazae41/phobos";
import { relative, resolve } from "path";
import { Mutex } from "./mutex.js";

const directory = resolve("./dist/test/")
const { pathname } = new URL(import.meta.url)
console.log(relative(directory, pathname))

test("mutex", async ({ test, wait }) => {
  const mutex = new Mutex(new Array<string>())

  test("first", async () => {
    await mutex.lock(async (order) => {
      order.push("first start")
      await new Promise(ok => setTimeout(ok, 100))
      order.push("first end")
    })
  })

  test("second", async () => {
    await mutex.lock(async (order) => {
      order.push("second start")
      await new Promise(ok => setTimeout(ok, 100))
      order.push("second end")
    })
  })

  test("third", async () => {
    await mutex.lock(async (order) => {
      order.push("third start")
      await new Promise(ok => setTimeout(ok, 100))
      order.push("third end")
    })
  })

  await wait()

  await mutex.lock(async (order) => {
    assert(JSON.stringify(order) === JSON.stringify([
      "first start",
      "first end",
      "second start",
      "second end",
      "third start",
      "third end"
    ]), `unexpected order`)
  })
})