import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// normalize temp directory paths in snapshots
// eslint-disable-next-line @typescript-eslint/no-var-requires
expect.addSnapshotSerializer(require("@lerna/test-helpers/src/lib/serializers/serialize-windows-paths"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
expect.addSnapshotSerializer(require("@lerna/test-helpers/src/lib/serializers/serialize-tempdir"));

describe("lerna ls", () => {
  describe("in a basic repo", () => {
    let testDir: string;

    beforeAll(async () => {
      testDir = await initFixture("basic");
    });

    it("should list public packages", async () => {
      const result = await cliRunner(testDir)("list");
      expect(result.stdout).toMatchInlineSnapshot(`
        package-1
        package-2
        package-3
        package-4
      `);
    });

    it("should also list private packages with --all", async () => {
      const result = await cliRunner(testDir)("list", "--all");
      expect(result.stdout).toMatchInlineSnapshot(`
    package-1
    package-2
    package-3
    package-4
    package-5 (PRIVATE)
    `);
    });

    it("lists public package versions and relative paths with --long", async () => {
      const result = await cliRunner(testDir)("list", "--long");
      expect(result.stdout).toMatchInlineSnapshot(`
        package-1 v1.0.0 packages/package-1
        package-2 v1.0.0 packages/package-2
        package-3 v1.0.0 packages/package-3
        package-4 v1.0.0 packages/package-4
        `);
    });

    it("lists all package versions and relative paths with --long --all", async () => {
      const result = await cliRunner(testDir)("list", "-la");
      expect(result.stdout).toMatchInlineSnapshot(`
        package-1 v1.0.0 packages/package-1
        package-2 v1.0.0 packages/package-2
        package-3 v1.0.0 packages/package-3
        package-4 v1.0.0 packages/package-4
        package-5 v1.0.0 packages/package-5 (PRIVATE)
        `);
    });

    it("lists public package locations with --parseable", async () => {
      const result = await cliRunner(testDir)("list", "--parseable");
      expect(result.stdout).toMatchInlineSnapshot(`
        __TEST_ROOTDIR__/packages/package-1
        __TEST_ROOTDIR__/packages/package-2
        __TEST_ROOTDIR__/packages/package-3
        __TEST_ROOTDIR__/packages/package-4
        `);
    });

    it("lists all package locations with --parseable --all", async () => {
      const result = await cliRunner(testDir)("list", "-pa");
      expect(result.stdout).toMatchInlineSnapshot(`
        __TEST_ROOTDIR__/packages/package-1
        __TEST_ROOTDIR__/packages/package-2
        __TEST_ROOTDIR__/packages/package-3
        __TEST_ROOTDIR__/packages/package-4
        __TEST_ROOTDIR__/packages/package-5
        `);
    });

    it("lists public package locations with --parseable --long", async () => {
      const result = await cliRunner(testDir)("list", "--parseable", "--long");
      expect(result.stdout).toMatchInlineSnapshot(`
        __TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
        __TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
        __TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
        __TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
        `);
    });

    it("lists all package locations with --parseable --long --all", async () => {
      const result = await cliRunner(testDir)("list", "-pal");
      expect(result.stdout).toMatchInlineSnapshot(`
        __TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
        __TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
        __TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
        __TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
        __TEST_ROOTDIR__/packages/package-5:package-5:1.0.0:PRIVATE
        `);
    });

    it("lists packages matching --scope", async () => {
      const result = await cliRunner(testDir)("list", "--scope", "package-1");
      expect(result.stdout).toMatchInlineSnapshot(`package-1`);
    });

    it("does not list packages matching --ignore", async () => {
      const result = await cliRunner(testDir)("list", "--ignore", "package-@(2|3|4|5)");
      expect(result.stdout).toMatchInlineSnapshot(`package-1`);
    });

    it("does not list private packages with --no-private", async () => {
      const result = await cliRunner(testDir)("list", "--no-private");
      expect(result.stdout).not.toMatch("package-5 v1.0.0 (private)");
    });
  });

  describe("in a repo with packages outside of packages/", () => {
    it("should list packages", async () => {
      const testDir = await initFixture("extra");
      const result = await cliRunner(testDir)("list");
      expect(result.stdout).toMatchInlineSnapshot(`
        package-3
        package-1
        package-2
        `);
    });
  });

  describe("--include-filtered-dependencies", () => {
    it("should list packages, including filtered ones", async () => {
      const testDir = await initFixture("include-filtered-dependencies");
      const result = await cliRunner(testDir)(
        "list",
        "--scope",
        "@test/package-2",
        "--include-filtered-dependencies"
      );
      expect(result.stdout).toMatchInlineSnapshot(`
        @test/package-2
        @test/package-1
        `);
    });
  });

  describe("--include-filtered-dependents", () => {
    it("should list packages, including filtered ones", async () => {
      const testDir = await initFixture("include-filtered-dependencies");
      const result = await cliRunner(testDir)(
        "list",
        "--scope",
        "@test/package-1",
        "--include-filtered-dependents"
      );
      expect(result.stdout).toMatchInlineSnapshot(`
        @test/package-1
        @test/package-2
        `);
    });
  });

  describe("with an undefined version", () => {
    it("replaces version with MISSING", async () => {
      const testDir = await initFixture("undefined-version");
      const result = await cliRunner(testDir)("list", "--long");
      expect(result.stdout).toMatchInlineSnapshot(`package-1 MISSING packages/package-1`);
    });

    it("appends MISSING flag to long parseable output", async () => {
      const testDir = await initFixture("undefined-version");
      const result = await cliRunner(testDir)("list", "--long", "--parseable");
      expect(result.stdout).toMatchInlineSnapshot(`__TEST_ROOTDIR__/packages/package-1:package-1:MISSING`);
    });
  });

  describe("--json", () => {
    it("should list packages as json objects", async () => {
      const testDir = await initFixture("basic");
      const result = await cliRunner(testDir)("list", "--json", "-a");

      // Output should be a parseable string
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput).toEqual([
        {
          location: expect.stringContaining("package-1"),
          name: "package-1",
          private: false,
          version: "1.0.0",
        },
        {
          location: expect.stringContaining("package-2"),
          name: "package-2",
          private: false,
          version: "1.0.0",
        },
        {
          location: expect.stringContaining("package-3"),
          name: "package-3",
          private: false,
          version: "1.0.0",
        },
        {
          location: expect.stringContaining("package-4"),
          name: "package-4",
          private: false,
          version: "1.0.0",
        },
        {
          location: expect.stringContaining("package-5"),
          name: "package-5",
          private: true,
          version: "1.0.0",
        },
      ]);
    });

    // TODO: investigate this failure
    // it.skip("emits empty array with no results", async () => {
    //   const testDir = await initFixture("basic");

    //   collectUpdates.setUpdated(testDir);
    //   const result = await cliRunner(testDir)("list", "--since", "deadbeef", "--json");

    //   expect(JSON.parse(output.logged())).toEqual([]);
    // });
  });

  describe("in a Yarn workspace", () => {
    it("should use package.json/workspaces setting", async () => {
      const testDir = await initFixture("yarn-workspaces");
      const result = await cliRunner(testDir)("list");
      expect(result.stdout).toMatchInlineSnapshot(`
        package-1
        package-2
        `);
    });
  });

  describe("with terribly complicated dependency cycles", () => {
    // for reference: 1->2, 1->3, 1->4, 2->4, 2->5, 3->4, 3->6, 4->1, 4->4,  5->4, 6->4, 7->4
    // We design the package tree in a very specific way. We want to test several different things
    // * A package depending on itself isn't added twice (package 4)
    // * A package being added twice in the same stage of the expansion isn't added twice (package 4)
    // * A package that has already been processed wont get added twice (package 1)
    it("should list all packages with no repeats", async () => {
      const testDir = await initFixture("cycles-and-repeated-deps");
      const result = await cliRunner(testDir)(
        "list",
        "--scope",
        "package-1",
        "--include-filtered-dependencies"
      );

      // should follow all transitive deps and pass all packages except 7 with no repeats
      expect(result.stdout).toMatchInlineSnapshot(`
        package-1
        package-2
        package-3
        package-4
        package-5
        package-6
        `);
    });
  });

  describe("with fancy 'packages' configuration", () => {
    it("lists globstar-nested packages", async () => {
      const testDir = await initFixture("globstar");
      const result = await cliRunner(testDir)("list");
      expect(result.stdout).toMatchInlineSnapshot(`
        globstar
        package-2
        package-4
        package-1
        package-3
        package-5
        `);
    });

    it("lists packages under explicitly configured node_modules directories", async () => {
      const testDir = await initFixture("explicit-node-modules");
      const result = await cliRunner(testDir)("list");
      expect(result.stdout).toMatchInlineSnapshot(`
        alle-pattern-root
        package-1
        package-2
        package-3
        package-4
        @scoped/package-5
        `);
    });

    it("throws an error when globstars and explicit node_modules configs are mixed", async () => {
      const testDir = await initFixture("mixed-globstar");
      const command = cliRunner(testDir)("list");

      await expect(command).rejects.toThrow("An explicit node_modules package path does not allow globstars");
    });
  });
});
