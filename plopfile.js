export default function (plop) {
  plop.setGenerator('route', {
    description: 'Create a new route with corresponding page component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message:
          'What is the name of your new route? (e.g., "blog", "contact")',
        validate: (value) => {
          if (/.+/.test(value)) {
            return true;
          }
          return 'Route name is required';
        },
      },
    ],
    actions: [
      // Create the page component
      {
        type: 'add',
        path: 'src/pages/{{kebabCase name}}.tsx',
        templateFile: 'plop-templates/page.tsx.hbs',
      },
      // Create the route file
      {
        type: 'add',
        path: 'src/routes/{{kebabCase name}}.tsx',
        templateFile: 'plop-templates/route.tsx.hbs',
      },
      // Modify root route to add the new link
      {
        type: 'modify',
        path: 'src/routes/__root.tsx',
        pattern: /([ \t]*)<\/div>/,
        template:
          '$1  <Link to="/{{kebabCase name}}" className="[&.active]:font-bold">\n$1    {{titleCase name}}\n$1  </Link>\n$1</div>',
      },
    ],
  });
}
