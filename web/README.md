# StartBase

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.6.

## Features & Interaction Logic

Start Base uses a unified, direct-manipulation interface designed for both mobile touchscreens and desktop mouse operations without requiring a separate edit mode.

### Sites & Groups Controls

- **Open Link**: Click or tap a site icon to open its URL immediately.
- **Context Menu (Edit / Delete)**:
  - **Touch / Mouse Hold**: Long-press (500ms) on any site icon or group header to open its context menu.
  - **Desktop Right-Click**: Right-click on a site icon or group header to immediately open the context menu.
  - **Quick Action Button**: Tap the `•••` icon on any group header for instant access to group settings.
- **Reordering (Drag & Drop)**:
  - **Sites**: Press and drag any site card to reorder it within a group or transfer it between groups.
  - **Groups**: Drag the grip handle (`⋮⋮`) on the left of a group header to reorder entire groups.
  - Sorting changes are saved automatically upon drop. Active context menus close automatically when dragging begins.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
