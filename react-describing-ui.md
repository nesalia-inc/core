Describing the UI – React

[![logo by @sawaratsuki1004](/_next/image?url=%2Fimages%2Fuwu.png&w=128&q=75 "logo by @sawaratsuki1004")](/)

[React](/)

[v19.2](/versions)

Search`⌘``Ctrl``K`

[Learn](/learn)

[Reference](/reference/react)

[Community](/community)

[Blog](/blog)

### GET STARTED

* [Quick Start](/learn "Quick Start")

  + [Tutorial: Tic-Tac-Toe](/learn/tutorial-tic-tac-toe "Tutorial: Tic-Tac-Toe")
  + [Thinking in React](/learn/thinking-in-react "Thinking in React")
* [Installation](/learn/installation "Installation")

  + [Creating a React App](/learn/creating-a-react-app "Creating a React App")
  + [Build a React App from Scratch](/learn/build-a-react-app-from-scratch "Build a React App from Scratch")
  + [Add React to an Existing Project](/learn/add-react-to-an-existing-project "Add React to an Existing Project")
* [Setup](/learn/setup "Setup")

  + [Editor Setup](/learn/editor-setup "Editor Setup")
  + [Using TypeScript](/learn/typescript "Using TypeScript")
  + [React Developer Tools](/learn/react-developer-tools "React Developer Tools")
* [React Compiler](/learn/react-compiler "React Compiler")

  + [Introduction](/learn/react-compiler/introduction "Introduction")
  + [Installation](/learn/react-compiler/installation "Installation")
  + [Incremental Adoption](/learn/react-compiler/incremental-adoption "Incremental Adoption")
  + [Debugging and Troubleshooting](/learn/react-compiler/debugging "Debugging and Troubleshooting")


### LEARN REACT

* [Describing the UI](/learn/describing-the-ui "Describing the UI")

  + [Your First Component](/learn/your-first-component "Your First Component")
  + [Importing and Exporting Components](/learn/importing-and-exporting-components "Importing and Exporting Components")
  + [Writing Markup with JSX](/learn/writing-markup-with-jsx "Writing Markup with JSX")
  + [JavaScript in JSX with Curly Braces](/learn/javascript-in-jsx-with-curly-braces "JavaScript in JSX with Curly Braces")
  + [Passing Props to a Component](/learn/passing-props-to-a-component "Passing Props to a Component")
  + [Conditional Rendering](/learn/conditional-rendering "Conditional Rendering")
  + [Rendering Lists](/learn/rendering-lists "Rendering Lists")
  + [Keeping Components Pure](/learn/keeping-components-pure "Keeping Components Pure")
  + [Your UI as a Tree](/learn/understanding-your-ui-as-a-tree "Your UI as a Tree")
* [Adding Interactivity](/learn/adding-interactivity "Adding Interactivity")

  + [Responding to Events](/learn/responding-to-events "Responding to Events")
  + [State: A Component's Memory](/learn/state-a-components-memory "State: A Component's Memory")
  + [Render and Commit](/learn/render-and-commit "Render and Commit")
  + [State as a Snapshot](/learn/state-as-a-snapshot "State as a Snapshot")
  + [Queueing a Series of State Updates](/learn/queueing-a-series-of-state-updates "Queueing a Series of State Updates")
  + [Updating Objects in State](/learn/updating-objects-in-state "Updating Objects in State")
  + [Updating Arrays in State](/learn/updating-arrays-in-state "Updating Arrays in State")
* [Managing State](/learn/managing-state "Managing State")

  + [Reacting to Input with State](/learn/reacting-to-input-with-state "Reacting to Input with State")
  + [Choosing the State Structure](/learn/choosing-the-state-structure "Choosing the State Structure")
  + [Sharing State Between Components](/learn/sharing-state-between-components "Sharing State Between Components")
  + [Preserving and Resetting State](/learn/preserving-and-resetting-state "Preserving and Resetting State")
  + [Extracting State Logic into a Reducer](/learn/extracting-state-logic-into-a-reducer "Extracting State Logic into a Reducer")
  + [Passing Data Deeply with Context](/learn/passing-data-deeply-with-context "Passing Data Deeply with Context")
  + [Scaling Up with Reducer and Context](/learn/scaling-up-with-reducer-and-context "Scaling Up with Reducer and Context")
* [Escape Hatches](/learn/escape-hatches "Escape Hatches")

  + [Referencing Values with Refs](/learn/referencing-values-with-refs "Referencing Values with Refs")
  + [Manipulating the DOM with Refs](/learn/manipulating-the-dom-with-refs "Manipulating the DOM with Refs")
  + [Synchronizing with Effects](/learn/synchronizing-with-effects "Synchronizing with Effects")
  + [You Might Not Need an Effect](/learn/you-might-not-need-an-effect "You Might Not Need an Effect")
  + [Lifecycle of Reactive Effects](/learn/lifecycle-of-reactive-effects "Lifecycle of Reactive Effects")
  + [Separating Events from Effects](/learn/separating-events-from-effects "Separating Events from Effects")
  + [Removing Effect Dependencies](/learn/removing-effect-dependencies "Removing Effect Dependencies")
  + [Reusing Logic with Custom Hooks](/learn/reusing-logic-with-custom-hooks "Reusing Logic with Custom Hooks")

[Learn React](/learn)

# Describing the UI

React is a JavaScript library for rendering user interfaces (UI). UI is built from small units like buttons, text, and images. React lets you combine them into reusable, nestable *components.* From web sites to phone apps, everything on the screen can be broken down into components. In this chapter, you’ll learn to create, customize, and conditionally display React components.

### In this chapter

* [How to write your first React component](/learn/your-first-component)
* [When and how to create multi-component files](/learn/importing-and-exporting-components)
* [How to add markup to JavaScript with JSX](/learn/writing-markup-with-jsx)
* [How to use curly braces with JSX to access JavaScript functionality from your components](/learn/javascript-in-jsx-with-curly-braces)
* [How to configure components with props](/learn/passing-props-to-a-component)
* [How to conditionally render components](/learn/conditional-rendering)
* [How to render multiple components at a time](/learn/rendering-lists)
* [How to avoid confusing bugs by keeping components pure](/learn/keeping-components-pure)
* [Why understanding your UI as trees is useful](/learn/understanding-your-ui-as-a-tree)

## Your first component

React applications are built from isolated pieces of UI called *components*. A React component is a JavaScript function that you can sprinkle with markup. Components can be as small as a button, or as large as an entire page. Here is a `Gallery` component rendering three `Profile` components:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
function Profile() {
  return (
    <img
      src="https://i.imgur.com/MK3eW3As.jpg"
      alt="Katherine Johnson"
    />
  );
}

export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
      <Profile />
    </section>
  );
}
```

Show more

## Ready to learn this topic?

Read **[Your First Component](/learn/your-first-component)** to learn how to declare and use React components.

[Read More](/learn/your-first-component)

---

## Importing and exporting components

You can declare many components in one file, but large files can get difficult to navigate. To solve this, you can *export* a component into its own file, and then *import* that component from another file:

Gallery.jsProfile.js

Gallery.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
import Profile from './Profile.js';

export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
      <Profile />
    </section>
  );
}
```

## Ready to learn this topic?

Read **[Importing and Exporting Components](/learn/importing-and-exporting-components)** to learn how to split components into their own files.

[Read More](/learn/importing-and-exporting-components)

---

## Writing markup with JSX

Each React component is a JavaScript function that may contain some markup that React renders into the browser. React components use a syntax extension called JSX to represent that markup. JSX looks a lot like HTML, but it is a bit stricter and can display dynamic information.

If we paste existing HTML markup into a React component, it won’t always work:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
export default function TodoList() {
  return (
    // This doesn't quite work!
    <h1>Hedy Lamarr's Todos</h1>
    <img
      src="https://i.imgur.com/yXOvdOSs.jpg"
      alt="Hedy Lamarr"
      class="photo"
    >
    <ul>
      <li>Invent new traffic lights
      <li>Rehearse a movie scene
      <li>Improve spectrum technology
    </ul>
```

Show more

If you have existing HTML like this, you can fix it using a [converter](https://transform.tools/html-to-jsx):

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
export default function TodoList() {
  return (
    <>
      <h1>Hedy Lamarr's Todos</h1>
      <img
        src="https://i.imgur.com/yXOvdOSs.jpg"
        alt="Hedy Lamarr"
        className="photo"
      />
      <ul>
        <li>Invent new traffic lights</li>
        <li>Rehearse a movie scene</li>
        <li>Improve spectrum technology</li>
      </ul>
    </>
  );
}
```

Show more

## Ready to learn this topic?

Read **[Writing Markup with JSX](/learn/writing-markup-with-jsx)** to learn how to write valid JSX.

[Read More](/learn/writing-markup-with-jsx)

---

## JavaScript in JSX with curly braces

JSX lets you write HTML-like markup inside a JavaScript file, keeping rendering logic and content in the same place. Sometimes you will want to add a little JavaScript logic or reference a dynamic property inside that markup. In this situation, you can use curly braces in your JSX to “open a window” to JavaScript:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
const person = {
  name: 'Gregorio Y. Zara',
  theme: {
    backgroundColor: 'black',
    color: 'pink'
  }
};

export default function TodoList() {
  return (
    <div style={person.theme}>
      <h1>{person.name}'s Todos</h1>
      <img
        className="avatar"
        src="https://i.imgur.com/7vQD0fPs.jpg"
        alt="Gregorio Y. Zara"
      />
      <ul>
        <li>Improve the videophone</li>
        <li>Prepare aeronautics lectures</li>
        <li>Work on the alcohol-fuelled engine</li>
      </ul>
    </div>
  );
}
```

Show more

## Ready to learn this topic?

Read **[JavaScript in JSX with Curly Braces](/learn/javascript-in-jsx-with-curly-braces)** to learn how to access JavaScript data from JSX.

[Read More](/learn/javascript-in-jsx-with-curly-braces)

---

## Passing props to a component

React components use *props* to communicate with each other. Every parent component can pass some information to its child components by giving them props. Props might remind you of HTML attributes, but you can pass any JavaScript value through them, including objects, arrays, functions, and even JSX!

App.jsutils.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
import { getImageUrl } from './utils.js'

export default function Profile() {
  return (
    <Card>
      <Avatar
        size={100}
        person={{
          name: 'Katsuko Saruhashi',
          imageId: 'YfeOqp2'
        }}
      />
    </Card>
  );
}

function Avatar({ person, size }) {
  return (
    <img
      className="avatar"
      src={getImageUrl(person)}
      alt={person.name}
      width={size}
      height={size}
    />
  );
}

function Card({ children }) {
  return (
    <div className="card">
      {children}
    </div>
  );
}
```

Show more

## Ready to learn this topic?

Read **[Passing Props to a Component](/learn/passing-props-to-a-component)** to learn how to pass and read props.

[Read More](/learn/passing-props-to-a-component)

---

## Conditional rendering

Your components will often need to display different things depending on different conditions. In React, you can conditionally render JSX using JavaScript syntax like `if` statements, `&&`, and `? :` operators.

In this example, the JavaScript `&&` operator is used to conditionally render a checkmark:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
function Item({ name, isPacked }) {
  return (
    <li className="item">
      {name} {isPacked && '✅'}
    </li>
  );
}

export default function PackingList() {
  return (
    <section>
      <h1>Sally Ride's Packing List</h1>
      <ul>
        <Item
          isPacked={true}
          name="Space suit"
        />
        <Item
          isPacked={true}
          name="Helmet with a golden leaf"
        />
        <Item
          isPacked={false}
          name="Photo of Tam"
        />
      </ul>
    </section>
  );
}
```

Show more

## Ready to learn this topic?

Read **[Conditional Rendering](/learn/conditional-rendering)** to learn the different ways to render content conditionally.

[Read More](/learn/conditional-rendering)

---

## Rendering lists

You will often want to display multiple similar components from a collection of data. You can use JavaScript’s `filter()` and `map()` with React to filter and transform your array of data into an array of components.

For each array item, you will need to specify a `key`. Usually, you will want to use an ID from the database as a `key`. Keys let React keep track of each item’s place in the list even if the list changes.

App.jsdata.jsutils.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
import { people } from './data.js';
import { getImageUrl } from './utils.js';

export default function List() {
  const listItems = people.map(person =>
    <li key={person.id}>
      <img
        src={getImageUrl(person)}
        alt={person.name}
      />
      <p>
        <b>{person.name}:</b>
        {' ' + person.profession + ' '}
        known for {person.accomplishment}
      </p>
    </li>
  );
  return (
    <article>
      <h1>Scientists</h1>
      <ul>{listItems}</ul>
    </article>
  );
}
```

Show more

## Ready to learn this topic?

Read **[Rendering Lists](/learn/rendering-lists)** to learn how to render a list of components, and how to choose a key.

[Read More](/learn/rendering-lists)

---

## Keeping components pure

Some JavaScript functions are *pure.* A pure function:

* **Minds its own business.** It does not change any objects or variables that existed before it was called.
* **Same inputs, same output.** Given the same inputs, a pure function should always return the same result.

By strictly only writing your components as pure functions, you can avoid an entire class of baffling bugs and unpredictable behavior as your codebase grows. Here is an example of an impure component:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
let guest = 0;

function Cup() {
  // Bad: changing a preexisting variable!
  guest = guest + 1;
  return <h2>Tea cup for guest #{guest}</h2>;
}

export default function TeaSet() {
  return (
    <>
      <Cup />
      <Cup />
      <Cup />
    </>
  );
}
```

Show more

You can make this component pure by passing a prop instead of modifying a preexisting variable:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```
function Cup({ guest }) {
  return <h2>Tea cup for guest #{guest}</h2>;
}

export default function TeaSet() {
  return (
    <>
      <Cup guest={1} />
      <Cup guest={2} />
      <Cup guest={3} />
    </>
  );
}
```

## Ready to learn this topic?

Read **[Keeping Components Pure](/learn/keeping-components-pure)** to learn how to write components as pure, predictable functions.

[Read More](/learn/keeping-components-pure)

---

## Your UI as a tree

React uses trees to model the relationships between components and modules.

A React render tree is a representation of the parent and child relationship between components.

![A tree graph with five nodes, with each node representing a component. The root node is located at the top the tree graph and is labelled 'Root Component'. It has two arrows extending down to two nodes labelled 'Component A' and 'Component C'. Each of the arrows is labelled with 'renders'. 'Component A' has a single 'renders' arrow to a node labelled 'Component B'. 'Component C' has a single 'renders' arrow to a node labelled 'Component D'.](/_next/image?url=%2Fimages%2Fdocs%2Fdiagrams%2Fgeneric_render_tree.dark.png&w=1080&q=75)

![A tree graph with five nodes, with each node representing a component. The root node is located at the top the tree graph and is labelled 'Root Component'. It has two arrows extending down to two nodes labelled 'Component A' and 'Component C'. Each of the arrows is labelled with 'renders'. 'Component A' has a single 'renders' arrow to a node labelled 'Component B'. 'Component C' has a single 'renders' arrow to a node labelled 'Component D'.](/_next/image?url=%2Fimages%2Fdocs%2Fdiagrams%2Fgeneric_render_tree.png&w=1080&q=75)

An example React render tree.

Components near the top of the tree, near the root component, are considered top-level components. Components with no child components are leaf components. This categorization of components is useful for understanding data flow and rendering performance.

Modelling the relationship between JavaScript modules is another useful way to understand your app. We refer to it as a module dependency tree.

![A tree graph with five nodes. Each node represents a JavaScript module. The top-most node is labelled 'RootModule.js'. It has three arrows extending to the nodes: 'ModuleA.js', 'ModuleB.js', and 'ModuleC.js'. Each arrow is labelled as 'imports'. 'ModuleC.js' node has a single 'imports' arrow that points to a node labelled 'ModuleD.js'.](/_next/image?url=%2Fimages%2Fdocs%2Fdiagrams%2Fgeneric_dependency_tree.dark.png&w=1080&q=75)

![A tree graph with five nodes. Each node represents a JavaScript module. The top-most node is labelled 'RootModule.js'. It has three arrows extending to the nodes: 'ModuleA.js', 'ModuleB.js', and 'ModuleC.js'. Each arrow is labelled as 'imports'. 'ModuleC.js' node has a single 'imports' arrow that points to a node labelled 'ModuleD.js'.](/_next/image?url=%2Fimages%2Fdocs%2Fdiagrams%2Fgeneric_dependency_tree.png&w=1080&q=75)

An example module dependency tree.

A dependency tree is often used by build tools to bundle all the relevant JavaScript code for the client to download and render. A large bundle size regresses user experience for React apps. Understanding the module dependency tree is helpful to debug such issues.

## Ready to learn this topic?

Read **[Your UI as a Tree](/learn/understanding-your-ui-as-a-tree)** to learn how to create a render and module dependency trees for a React app and how they’re useful mental models for improving user experience and performance.

[Read More](/learn/understanding-your-ui-as-a-tree)

---

## What’s next?

Head over to [Your First Component](/learn/your-first-component) to start reading this chapter page by page!

Or, if you’re already familiar with these topics, why not read about [Adding Interactivity](/learn/adding-interactivity)?

[NextYour First Component](/learn/your-first-component)

---

Copyright © Meta Platforms, Inc

no uwu plz

uwu?

Logo by[@sawaratsuki1004](https://twitter.com/sawaratsuki1004)

[Learn React](/learn)

[Quick Start](/learn)

[Installation](/learn/installation)

[Describing the UI](/learn/describing-the-ui)

[Adding Interactivity](/learn/adding-interactivity)

[Managing State](/learn/managing-state)

[Escape Hatches](/learn/escape-hatches)

[API Reference](/reference/react)

[React APIs](/reference/react)

[React DOM APIs](/reference/react-dom)

[Community](/community)

[Code of Conduct](https://github.com/facebook/react/blob/main/CODE_OF_CONDUCT.md)

[Meet the Team](/community/team)

[Docs Contributors](/community/docs-contributors)

[Acknowledgements](/community/acknowledgements)

More

[Blog](/blog)

[React Native](https://reactnative.dev/)

[Privacy](https://opensource.facebook.com/legal/privacy)

[Terms](https://opensource.fb.com/legal/terms/)

## On this page

* [Overview](#)
* [Your first component](#your-first-component)
* [Importing and exporting components](#importing-and-exporting-components)
* [Writing markup with JSX](#writing-markup-with-jsx)
* [JavaScript in JSX with curly braces](#javascript-in-jsx-with-curly-braces)
* [Passing props to a component](#passing-props-to-a-component)
* [Conditional rendering](#conditional-rendering)
* [Rendering lists](#rendering-lists)
* [Keeping components pure](#keeping-components-pure)
* [Your UI as a tree](#your-ui-as-a-tree)
* [What’s next?](#whats-next)