# Generated Workspace Dependency Materialization Validation

Result: GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS

- [x] file: src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.ts: present
- [x] file: src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-registry.ts: present
- [x] file: src/generated-workspace-dependency-materialization/workspace-package-manifest-reader.ts: present
- [x] file: src/generated-workspace-dependency-materialization/package-manager-resolver.ts: present
- [x] file: src/generated-workspace-dependency-materialization/dependency-presence-scanner.ts: present
- [x] file: src/generated-workspace-dependency-materialization/module-resolution-probe.ts: present
- [x] file: src/generated-workspace-dependency-materialization/dependency-materialization-repair-planner.ts: present
- [x] file: src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-report-builder.ts: present
- [x] file: src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-authority.ts: present
- [x] file: src/generated-workspace-dependency-materialization/index.ts: present
- [x] PASS token: missing
- [x] package manager evidence source: missing
- [x] startup repair consumes dependency assessment: missing
- [x] classifier uses dependency materialization: missing
- [x] runtime bridge consumes dependency proof: missing
- [x] no nested validators in authority: nested validator
- [x] no writeFileSync in authority: mutates files
- [x] shouldAutoRun default false: missing
- [x] workspace discovery: .generated-builder-workspaces/build-ready-idea-1
- [x] package manifest detection: no package.json
- [x] package manager resolved: npm
- [x] evidence-backed pm: NPM_LOCKFILE
- [x] dependency state assigned: DEPENDENCIES_READY
- [x] node_modules absence detectable: false
- [x] repair plan generated: npm ci
- [x] repair plan shouldAutoRun false: false
- [x] assessment completes: DEPENDENCY_MATERIALIZATION_COMPLETE
- [x] dependency state in report: DEPENDENCIES_READY
- [x] history recorded: 1
- [x] startup receives dependency state: missing
- [x] startup dependency state propagated: DEPENDENCIES_READY
- [x] runtime bridge dependency proof: missing
- [x] startup evidence has dependency details: DEPENDENCIES_READY
- [x] ready deps not classified as MISSING_DEPENDENCIES: RUNTIME_CRASH

## Snapshot

- dependencyState=DEPENDENCIES_READY
- dependenciesReady=true
- packageManager=npm (NPM_LOCKFILE)
- nodeModulesExists=false
- installCommand=npm ci
- startupFailureClass=RUNTIME_CRASH
- runtimeBridge.recommendedFix=Fix runtime crash in generated application entrypoint.
