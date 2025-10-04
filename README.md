# Mutex

Rust-like Mutex and Semaphore for TypeScript

```bash
npm install @hazae41/mutex
```

```bash
deno install jsr:@hazae41/mutex
```

[**📦 NPM**](https://www.npmjs.com/package/@hazae41/mutex) • [**📦 JSR**](https://jsr.io/@hazae41/mutex)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Similar to Rust
- Can hold data
- Unit-tested
- Memory-safe

## Usage

### Mutex

```typescript
import { Mutex } from "@hazae41/mutex"

const mutex = new Mutex(123)

/**
 * You can queue a callback 
 */
async function runOrWait() {
  await mutex.runOrWait((x) => /* do (async) stuff with x */)
}

/**
 * You can throw if the mutex is already locked
 */
async function runOrThrow() {
  await mutex.runOrThrow((x) => /* do stuff with x */)
}

/**
 * You can return something from the callback
 */
async function runOrWait2() {
  const y = await mutex.runOrWait((x) => x * 2)
}

/**
 * You can use async code
 */
async function runOrWait3() {
  const y = await mutex.runOrWait(async (x) => await f(x))
}

/**
 * You can acquire and release when you want
 */
async function getOrWait() {
  const x = await mutex.getOrWait()
  const y = x.get() * 2
  x.release()
}

/**
 * You can acquire and release with `using`
 */
async function getOrWait2() {
  using x = await mutex.getOrWait()
  const y = x.get() * 2
}
```

### Semaphore

Same functions as Mutex but you can specify a capacity

```tsx
const semaphore = new Semaphore(123, 3)

const a = await semaphore.getOrThrow()
const b = await semaphore.getOrThrow()
const c = await semaphore.getOrThrow()
const d = await semaphore.getOrThrow() // will throw
```

You can see it like `Mutex<T> = Semaphore<T, 1>`