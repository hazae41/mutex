import { assert, rejects, test } from "@hazae41/phobos";
import { relative, resolve } from "path";
import { Mutex, Semaphore } from "./mutex.js";

const directory = resolve("./dist/test/")
const { pathname } = new URL(import.meta.url)
console.log(relative(directory, pathname))

await test("mutex", async ({ test, wait }) => {
  const mutex = new Mutex(new Array<string>())

  test("first", async () => {
    await mutex.runOrWait(async (order) => {
      order.push("first start")
      await new Promise(ok => setTimeout(ok, 100))
      order.push("first end")
    })
  })

  test("second", async () => {
    await mutex.runOrWait(async (order) => {
      order.push("second start")
      await new Promise(ok => setTimeout(ok, 100))
      order.push("second end")
    })
  })

  test("third", async () => {
    await mutex.runOrWait(async (order) => {
      order.push("third start")
      await new Promise(ok => setTimeout(ok, 100))
      order.push("third end")
    })
  })

  test("try lock", async () => {
    assert(await rejects(() => mutex.runOrThrow(async () => { })), `tryLock should err`)
  })

  await wait()

  assert(mutex.locked === false, `should be unlocked`)

  await mutex.runOrWait(async (order) => {
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

await test("acquire", async ({ test, wait }) => {
  const mutex = new Mutex(new Array<string>())

  test("first", async () => {
    const lock = await mutex.getOrWait()
    lock.inner.push("first start")
    await new Promise(ok => setTimeout(ok, 100))
    lock.inner.push("first end")
    lock.release()
  })

  test("second", async () => {
    await mutex.runOrWait(async (order) => {
      order.push("second start")
      await new Promise(ok => setTimeout(ok, 100))
      order.push("second end")
    })
  })

  test("third", async () => {
    const lock = await mutex.getOrWait()
    lock.inner.push("third start")
    await new Promise(ok => setTimeout(ok, 100))
    lock.inner.push("third end")
    lock.release()
  })

  test("try lock", async () => {
    assert(await rejects(() => mutex.runOrThrow(async () => { })), `tryLock should err`)
  })

  await wait()

  assert(mutex.locked === false, `should be unlocked`)

  await mutex.runOrWait(async (order) => {
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

await test("semaphore", async () => {

  const semaphore = new Semaphore(undefined, 3)

  const tick = async () => {
    while (true) {
      console.log("tick")
      await new Promise(ok => setTimeout(ok, 100))
    }
  }

  const lock = (i: number) => semaphore.runOrWait(async () => {
    console.log("start", i)
    await new Promise(ok => setTimeout(ok, 1000))
    console.log("end", i)
  })

  const wait = async () => {
    console.log("wait")
    await semaphore.runOrWait(() => { })
    console.log("done")
  }

  const acquire = async () => {
    const lock = await semaphore.getOrWait()
    console.log("acquire")
    await new Promise(ok => setTimeout(ok, 1000))
    console.log("release")
    lock.release()
  }

  tick()
  lock(1)
  lock(2)
  lock(3)
  acquire()
  lock(4)
  lock(5)
  wait()
  lock(6)
  lock(7)
  lock(8)
  lock(9)
  lock(10)
})