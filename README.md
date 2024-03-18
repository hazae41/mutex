# Mutex

Rust-like Mutex and Semaphore for TypeScript

```bash
npm i @hazae41/mutex
```

[**Node Package 📦**](https://www.npmjs.com/package/@hazae41/mutex)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Similar to Rust
- Can hold data
- Unit-tested
- Memory-safe
- Uses Result from `@hazae41/result`

## Usage

### Mutex

```typescript
import { Mutex } from "@hazae41/mutex"

const mutex = new Mutex(123)

/**
 * You can queue a callback 
 */
async function lockOrWait() {
  await mutex.lock(async (x) => /* do stuff with x */)
}

/**
 * You can return something from the callback
 */
async function lockOrWaitAndLog() {
  const x = await mutex.lock(async (x) => x)
  console.log(x)
}

/**
 * You can throw if the mutex is already locked
 */
async function lockOrThrow() {
  await mutex.lockOrThrow(async (x) => /* do stuff with x */)
}

/**
 * You can return a result if the mutex is already locked
 */
async function tryLock() {
  const result = mutex.tryLock(async (x) => /* do stuff with x */)

  if (result.isErr()) // if couldn't lock
    throw result.getErr()

  await result.get() // wait task
}

/**
 * You can just wait unlock without locking
 */
async function wait() {
  await mutex.wait()
}

/**
 * You can acquire and release when you want
 */
async function acquire() {
  const lock = await mutex.acquire()
  console.log(lock.get())
  lock.release()
}

/**
 * You can acquire and release with `using`
 */
async function acquireAndUse() {
  using lock = await mutex.acquire()
  console.log(lock.get())
}
```

### Semaphore

Same functions as Mutex but you can specify a capacity

