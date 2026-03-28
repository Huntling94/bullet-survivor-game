import { describe, it, expect, vi } from "vitest";
import { ObjectPool } from "./object-pool";

interface TestItem {
  id: number;
  value: string;
}

let nextId = 0;

function createPool(initialSize: number = 3) {
  nextId = 0;
  return new ObjectPool<TestItem>(
    () => ({ id: nextId++, value: "new" }),
    (item) => {
      item.value = "reset";
    },
    initialSize,
  );
}

describe("ObjectPool", () => {
  it("pre-allocates initial items", () => {
    const pool = createPool(5);
    expect(pool.activeLength).toBe(0);
    // Can acquire 5 without growing
    for (let i = 0; i < 5; i++) {
      pool.acquire();
    }
    expect(pool.activeLength).toBe(5);
  });

  it("acquire returns an item", () => {
    const pool = createPool();
    const item = pool.acquire();
    expect(item).toBeDefined();
    expect(pool.activeLength).toBe(1);
  });

  it("release recycles an item", () => {
    const pool = createPool();
    const item = pool.acquire();
    pool.release(item);
    expect(pool.activeLength).toBe(0);

    const recycled = pool.acquire();
    expect(recycled).toBe(item);
    expect(recycled.value).toBe("reset");
  });

  it("grows beyond initial size", () => {
    const pool = createPool(2);
    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire(); // grows pool
    expect(pool.activeLength).toBe(3);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(c).toBeDefined();
  });

  it("getActive returns only active items", () => {
    const pool = createPool();
    pool.acquire();
    pool.acquire();
    const third = pool.acquire();
    pool.release(third);
    expect(pool.getActive().length).toBe(2);
  });

  it("clear resets all active items", () => {
    const pool = createPool();
    const a = pool.acquire();
    a.value = "dirty";
    const b = pool.acquire();
    b.value = "dirty";

    pool.clear();
    expect(pool.activeLength).toBe(0);
    expect(a.value).toBe("reset");
    expect(b.value).toBe("reset");
  });

  it("release calls reset function", () => {
    const reset = vi.fn();
    const pool = new ObjectPool(() => ({ id: 0, value: "" }), reset, 1);
    const item = pool.acquire();
    pool.release(item);
    expect(reset).toHaveBeenCalledWith(item);
  });

  it("release is no-op for items not in pool", () => {
    const pool = createPool();
    pool.acquire();
    const outsider = { id: 999, value: "outsider" };
    pool.release(outsider);
    expect(pool.activeLength).toBe(1);
  });

  it("release is no-op for already-released items", () => {
    const pool = createPool();
    const item = pool.acquire();
    pool.release(item);
    pool.release(item);
    expect(pool.activeLength).toBe(0);
  });
});
