const clonedeep = require("lodash.clonedeep");

const { setActive, setTitleFromURL, setURLFromSlug } = require("./utils");
// This is a pure Node port of the `macros/LearnSidebar.ejs` macro.

// This could be memoized.
// But note that if you do that, we're afterwards computing and setting `.isActive`
// based on its output so you'd have to deep-clone the output of this function first.
// At this point, all the deep cloning is probably just overheads that aren't
// worth it.

const getRelatedByLocale = (locale) => {
  const baseURL = `/${locale}/docs/Learn`;

  // XXX TODO!
  // Of the 260 keys here in 'en-US' only 59 are actually ever used!
  const text = {
    "en-US": {
      Complete_beginners: "Complete beginners start here!",
      Getting_started_with_the_web: "Getting started with the Web",
      Getting_started_with_the_web_overview:
        "Getting started with the Web overview",
      Installing_basic_software: "Installing basic software",
      What_will_your_website_look_like: "What will your website look like?",
      Dealing_with_files: "Dealing with files",
      HTML_basics: "HTML basics",
      CSS_basics: "CSS basics",
      JavaScript_basics: "JavaScript basics",
      Publishing_your_website: "Publishing your website",
      How_the_Web_works: "How the Web works",
      HTML_structuring_the_Web: "HTML — Structuring the Web",
      Introduction_to_HTML: "Introduction to HTML",
      Introduction_to_HTML_overview: "Introduction to HTML overview",
      Getting_started_with_HTML: "Getting started with HTML",
      Whats_in_the_head_metadata_in_HTML:
        "What's in the head? Metadata in HTML",
      HTML_text_fundamentals: "HTML text fundamentals",
      Creating_hyperlinks: "Creating hyperlinks",
      Advanced_text_formatting: "Advanced text formatting",
      Document_and_website_structure: "Document and website structure",
      Debugging_HTML: "Debugging HTML",
      Assessment_marking_up_a_letter: "Assessment: Marking up a letter",
      Assessment_structuring_a_page_of_content:
        "Assessment: Structuring a page of content",
      Multimedia_and_embedding: "Multimedia and embedding",
      Multimedia_and_embedding_overview: "Multimedia and embedding overview",
      Images_in_HTML: "Images in HTML",
      Video_and_audio_content: "Video and audio content",
      Other_embedding_technologies:
        "From object to iframe — other embedding technologies",
      Adding_vector_graphics_to_the_Web: "Adding vector graphics to the Web",
      Responsive_images: "Responsive images",
      Assessment_Mozilla_splash_page: "Assessment: Mozilla splash page",
      HTML_tables: "HTML tables",
      HTML_tables_overview: "HTML tables overview",
      HTML_table_basics: "HTML table basics",
      HTML_table_advanced: "HTML Table advanced features and accessibility",
      Assessment_Structuring_planet_data: "Assessment: Structuring planet data",
      CSS_styling_the_Web: "CSS — Styling the Web",
      CSS_first_steps: "CSS first steps",
      CSS_first_steps_overview: "CSS first steps overview",
      What_is_CSS: "What is CSS?",
      Getting_started_with_CSS: "Getting started with CSS",
      How_CSS_is_structured: "How CSS is structured",
      How_CSS_works: "How CSS works",
      Using_your_new_knowledge: "Using your new knowledge",
      CSS_building_blocks: "CSS building blocks",
      CSS_building_blocks_overview: "CSS building blocks overview",
      Cascade_and_inheritance: "Cascade and inheritance",
      CSS_selectors: "CSS selectors",
      The_box_model: "The box model",
      Backgrounds_and_borders: "Backgrounds and borders",
      Handling_different_text_directions: "Handling different text directions",
      Overflowing_content: "Overflowing content",
      Values_and_units: "Values and units",
      Sizing_items_in_CSS: "Sizing items in CSS",
      Images_media_and_form_elements: "Images, media, and form elements",
      Styling_tables: "Styling tables",
      Debugging_CSS: "Debugging CSS",
      Organizing_your_CSS: "Organizing your CSS",
      Styling_text: "Styling text",
      Styling_text_overview: "Styling text overview",
      Fundamental_text_and_font_styling: "Fundamental text and font styling",
      Styling_lists: "Styling lists",
      Styling_links: "Styling links",
      Web_fonts: "Web fonts",
      Assessment_typesetting_a_community_school_homepage:
        "Assessment: Typesetting a community school homepage",
      CSS_layout: "CSS layout",
      CSS_layout_overview: "CSS layout overview",
      Layout_introduction: "Introduction to CSS layout",
      Normal_Flow: "Normal Flow",
      Flexbox: "Flexbox",
      Grids: "Grids",
      Floats: "Floats",
      Positioning: "Positioning",
      "Multiple-column_Layout": "Multiple-column Layout",
      Responsive_design: "Responsive design",
      Media_queries: "Beginner's guide to media queries",
      Legacy_Layout_Methods: "Legacy Layout Methods",
      Supporting_Older_Browsers: "Supporting Older Browsers",
      Fundamental_Layout_Comprehension: "Fundamental Layout Comprehension",
      "JavaScript_dynamic_client-side_scripting":
        "JavaScript — Dynamic client-side scripting",
      JavaScript_first_steps: "JavaScript first steps",
      JavaScript_first_steps_overview: "JavaScript first steps overview",
      What_is_JavaScript: "What is JavaScript?",
      A_first_splash_into_JavaScript: "A first splash into JavaScript",
      What_went_wrong: "What went wrong? Troubleshooting JavaScript",
      Storing_the_information_you_need:
        "Storing the information you need — Variables",
      Basic_math_in_JavaScript:
        "Basic math in JavaScript — Numbers and operators",
      Handling_text: "Handling text — Strings in JavaScript",
      Useful_string_methods: "Useful string methods",
      Arrays: "Arrays",
      Assessment_silly_story_generator: "Assessment: Silly story generator",
      JavaScript_building_blocks: "JavaScript building blocks",
      JavaScript_building_blocks_overview:
        "JavaScript building blocks overview",
      Making_decisions_in_your_code:
        "Making decisions in your code — Conditionals",
      Looping_code: "Looping code",
      Functions: "Functions — Reusable blocks of code",
      Build_your_own_function: "Build your own function",
      Function_return_values: "Function return values",
      Introduction_to_events: "Introduction to events",
      Assessment_image_gallery: "Assessment: Image gallery",
      Introducing_JavaScript_objects: "Introducing JavaScript objects",
      Introducing_JavaScript_objects_overview:
        "Introducing JavaScript objects overview",
      Object_basics: "Object basics",
      "Object-oriented_JavaScript_for_beginners":
        "Object-oriented JavaScript for beginners",
      Object_prototypes: "Object prototypes",
      Inheritance_in_JavaScript: "Inheritance in JavaScript",
      Working_with_JSON_data: "Working with JSON data",
      Object_building_practice: "Object building practice",
      Assessment_Adding_features_to_our_bouncing_balls_demo:
        "Assessment: Adding features to our bouncing balls demo",
      Asynchronous_JavaScript: "Asynchronous JavaScript",
      Asynchronous_JavaScript_overview: "Asynchronous JavaScript overview",
      General_asynchronous_programming_concepts:
        "General asynchronous programming concepts",
      Introducing_asynchronous_JavaScript:
        "Introducing asynchronous JavaScript",
      Timeouts_intervals:
        "Cooperative asynchronous Java​Script: Timeouts and intervals",
      Promises: "Graceful asynchronous programming with Promises",
      Async_await:
        "Making asynchronous programming easier with async and await",
      Choosing_the_right_approach: "Choosing the right approach",
      "Client-side_web_APIs": "Client-side web APIs",
      "Client-side_web_APIs_Introduction": "Introduction to web APIs",
      "Client-side_web_APIs_Manipulating_documents": "Manipulating documents",
      "Client-side_web_APIs_Fetching_data": "Fetching data from the server",
      "Client-side_web_APIs_Third_party_APIs": "Third party APIs",
      "Client-side_web_APIs_Drawing_graphics": "Drawing graphics",
      "Client-side_web_APIs_Video_and_audio_APIs": "Video and audio APIs",
      "Client-side_web_APIs_client-side_storage": "Client-side storage",
      Web_forms: "Web forms — Working with user data",
      Web_forms_core: "Core forms learning pathway",
      Web_forms_overview: "Web forms overview",
      Your_first_form: "Your first form",
      How_to_structure_a_web_form: "How to structure a web form",
      Basic_native_form_controls: "Basic native form controls",
      The_HTML5_input_types: "The HTML5 input types",
      Other_form_controls: "Other form controls",
      Styling_web_forms: "Styling web forms",
      Advanced_form_styling: "Advanced form styling",
      "UI_pseudo-classes": "UI pseudo-classes",
      "Client-side_form_validation": "Client-side form validation",
      Sending_form_data: "Sending form data",
      Web_forms_advanced: "Advanced forms articles",
      How_to_build_custom_form_controls: "How to build custom form controls",
      Sending_forms_through_JavaScript: "Sending forms through JavaScript",
      CSS_property_compatibility_table_for_form_controls:
        "CSS property compatibility table for form controls",
      "Accessibility_—_Make_the_web_usable_by_everyone":
        "Accessibility — Make the web usable by everyone",
      Accessibility_guides: "Accessibility guides",
      Accessibility_assessment: "Accessibility assessment",
      Accessibility_overview: "Accessibility overview",
      What_is_accessibility: "What is accessibility?",
      HTML_a_good_basis_for_accessibility:
        "HTML: A good basis for accessibility",
      CSS_and_JavaScript_accessibility_best_practices:
        "CSS and JavaScript accessibility best practices",
      "WAI-ARIA_basics": "WAI-ARIA basics",
      Accessible_multimedia: "Accessible multimedia",
      Mobile_accessibility: "Mobile accessibility",
      Assessment_Accessibility_troubleshooting:
        "Assessment: Accessibility troubleshooting",
      Tools_and_testing: "Tools and testing",
      Cross_browser_testing: "Cross browser testing",
      Cross_browser_testing_overview: "Cross browser testing overview",
      Introduction_to_cross_browser_testing:
        "Introduction to cross browser testing",
      Strategies_for_carrying_out_testing:
        "Strategies for carrying out testing",
      Handling_common_HTML_and_CSS_problems:
        "Handling common HTML and CSS problems",
      Handling_common_JavaScript_problems:
        "Handling common JavaScript problems",
      Handling_common_accessibility_problems:
        "Handling common accessibility problems",
      Implementing_feature_detection: "Implementing feature detection",
      Introduction_to_automated_testing: "Introduction to automated testing",
      Setting_up_your_own_test_automation_environment:
        "Setting up your own test automation environment",
      Git_and_GitHub: "Git and GitHub",
      Git_and_GitHub_overview: "Git and GitHub overview",
      "Client-side_web_development_tools": "Client-side web development tools",
      "Client-side_web_development_tools_index":
        "Client-side web development tools index",
      "Client-side_tooling_overview": "Client-side tooling overview",
      Command_line_crash_course: "Command line crash course",
      Package_management_basics: "Package management basics",
      Introducing_a_complete_toolchain: "Introducing a complete toolchain",
      Deploying_our_app: "Deploying our app",
      "Introduction_to_client-side_frameworks":
        "Introduction to client-side frameworks",
      "Client-side_frameworks_overview": "Client-side frameworks overview",
      Framework_main_features: "Framework main features",
      React: "React",
      Getting_started_with_React: "Getting started with React",
      Beginning_our_React_todo_list: "Beginning our React todo list",
      Componentizing_our_React_app: "Componentizing our React app",
      "React_interactivity:_Events_and_state":
        "React interactivity: Events and state",
      "React_interactivity:_Editing_filtering_conditional_rendering":
        "React interactivity: Editing, filtering, conditional rendering",
      Accessibility_in_React: "Accessibility in React",
      React_resources: "React resources",
      Ember: "Ember",
      Getting_started_with_Ember: "Getting started with Ember",
      Ember_app_structure_and_componentization:
        "Ember app structure and componentization",
      "Ember_interactivity:_Events_classes_and_state":
        "Ember interactivity: Events, classes and state",
      "Ember_Interactivity:_Footer_functionality_conditional_rendering":
        "Ember Interactivity: Footer functionality, conditional rendering",
      Routing_in_Ember: "Routing in Ember",
      Ember_resources_and_troubleshooting:
        "Ember resources and troubleshooting",
      Vue: "Vue",
      Getting_started_with_Vue: "Getting started with Vue",
      Creating_our_first_Vue_component: "Creating our first Vue component",
      Rendering_a_list_of_Vue_components: "Rendering a list of Vue components",
      "Adding_a_new_todo_form:_Vue_events_methods_and_models":
        "Adding a new todo form: Vue events, methods, and models",
      Styling_Vue_components_with_CSS: "Styling Vue components with CSS",
      Using_Vue_computed_properties: "Using Vue computed properties",
      "Vue_conditional_rendering:_editing_existing_todos":
        "Vue conditional rendering: editing existing todos",
      Focus_management_with_Vue_refs: "Focus management with Vue refs",
      Vue_resources: "Vue resources",
      Svelte: "Svelte",
      Getting_started_with_Svelte: "Getting started with Svelte",
      Starting_our_Svelte_Todo_list_app: "Starting our Svelte Todo list app",
      "Dynamic_behavior_in_Svelte:_working_with_variables_and_props":
        "Dynamic behavior in Svelte: working with variables and props",
      Componentizing_our_Svelte_app: "Componentizing our Svelte app",
      "Advanced_Svelte:_Reactivity_lifecycle_accessibility":
        "Advanced Svelte: Reactivity, lifecycle, accessibility",
      Working_with_Svelte_stores: "Working with Svelte stores",
      TypeScript_support_in_Svelte: "TypeScript support in Svelte",
      Deployment_and_next_steps: "Deployment and next steps",
      Angular: "Angular",
      Getting_started_with_Angular: "Getting started with Angular",
      Beginning_our_Angular_todo_list_app:
        "Beginning our Angular todo list app",
      Styling_our_Angular_app: "Styling our Angular app",
      Creating_an_item_component: "Creating an item component",
      "Filtering_our_to-do_items": "Filtering our to-do items",
      Building_Angular_applications_and_further_resources:
        "Building Angular applications and further resources",
      "Server-side_website_programming": "Server-side website programming",
      First_steps: "First steps",
      First_steps_overview: "First steps overview",
      "Introduction_to_the_server-side": "Introduction to the server-side",
      "Client-Server_overview": "Client-Server overview",
      "Server-side_web_frameworks": "Server-side web frameworks",
      Website_security: "Website security",
      "Django_web_framework_(Python)": "Django web framework (Python)",
      "Django_web_framework_(Python)_overview":
        "Django web framework (Python) overview",
      Django_introduction: "Introduction",
      Setting_up_a_development_environment:
        "Setting up a development environment",
      Tutorial_The_Local_Library_website: "Tutorial: The Local Library website",
      Tutorial_Part_2_Creating_a_skeleton_website:
        "Tutorial Part 2: Creating a skeleton website",
      Tutorial_Part_3_Using_models: "Tutorial Part 3: Using models",
      Tutorial_Part_4_Django_admin_site: "Tutorial Part 4: Django admin site",
      Tutorial_Part_5_Creating_our_home_page:
        "Tutorial Part 5: Creating our home page",
      Tutorial_Part_6_Generic_list_and_detail_views:
        "Tutorial Part 6: Generic list and detail views",
      Tutorial_Part_7_Sessions_framework: "Tutorial Part 7: Sessions framework",
      Tutorial_Part_8_User_authentication_and_permissions:
        "Tutorial Part 8: User authentication and permissions",
      Tutorial_Part_9_Working_with_forms: "Tutorial Part 9: Working with forms",
      Tutorial_Part_10_Testing_a_Django_web_application:
        "Tutorial Part 10: Testing a Django web application",
      Tutorial_Part_11_Deploying_Django_to_production:
        "Tutorial Part 11: Deploying Django to production",
      Web_application_security: "Web application security",
      Assessment_DIY_mini_blog: "Assessment: DIY mini blog",
      "Express_Web_Framework_(Node.js_JavaScript)":
        "Express Web Framework (node.js/JavaScript)",
      "Express_Web_Framework_(Node.js_JavaScript)_overview":
        "Express Web Framework (Node.js/JavaScript) overview",
      Express_Node_introduction: "Express/Node introduction",
      "Setting_up_a_Node_(Express)_development_environment":
        "Setting up a Node (Express) development environment",
      Express_Tutorial_The_Local_Library_website:
        "Express tutorial: The Local Library website",
      Express_Tutorial_Part_2_Creating_a_skeleton_website:
        "Express Tutorial Part 2: Creating a skeleton website",
      "Express_Tutorial_Part_3_Using_a_database_(with_Mongoose)":
        "Express Tutorial Part 3: Using a database (with Mongoose)",
      Express_Tutorial_Part_4_Routes_and_controllers:
        "Express Tutorial Part 4: Routes and controllers",
      Express_Tutorial_Part_5_Displaying_library_data:
        "Express Tutorial Part 5: Displaying library data",
      Express_Tutorial_Part_6_Working_with_forms:
        "Express Tutorial Part 6: Working with forms",
      Express_Tutorial_Part_7_Deploying_to_production:
        "Express Tutorial Part 7: Deploying to production",
      Further_resources: "Further resources",
      Common_questions: "Common questions",
      HTML_questions: "HTML questions",
      CSS_questions: "CSS questions",
      JavaScript_questions: "JavaScript questions",
      Web_mechanics: "Web mechanics",
      Tools_and_setup: "Tools and setup",
      Design_and_accessibility: "Design and accessibility",
    },
    de: {
      Complete_beginners: "Anfänger starten hier!",
      Getting_started_with_the_web: "Lernen Sie das Internet kennen",
      Getting_started_with_the_web_overview:
        "Lernen Sie das Internet kennen — Übersicht",
      Installing_basic_software: "Notwendige Software installieren",
      What_will_your_website_look_like: "Wie wird Ihre Webseite aussehen?",
      Dealing_with_files: "Dateien nutzen",
      HTML_basics: "HTML-Grundlagen",
      CSS_basics: "CSS-Grundlagen",
      JavaScript_basics: "JavaScript-Grundlagen",
      Publishing_your_website: "Ihre Webseite veröffentlichen",
      How_the_Web_works: "Wie das Internet funktioniert",
      HTML_structuring_the_Web: "HTML — Webseiten strukturieren",
      Introduction_to_HTML: "Einführung in HTML",
      Introduction_to_HTML_overview: "Einführung in HTML — Übersicht",
      Getting_started_with_HTML: "Lernen Sie HTML kennen",
      Whats_in_the_head_metadata_in_HTML:
        "Was gehört in den Kopf? Metadaten in HTML",
      HTML_text_fundamentals: "Einfache Textformatierung mit HTML",
      Creating_hyperlinks: "Erstellen von Links",
      Advanced_text_formatting: "Fortgeschrittene Textformatierung",
      Document_and_website_structure: "Struktur in die Webseite bringen",
      Debugging_HTML: "Fehlersuche in HTML",
      Assessment_marking_up_a_letter: "Aufgabe: Formatierung eines Briefes",
      Assessment_structuring_a_page_of_content:
        "Aufgabe: Strukturieren einer Webseite",
      Multimedia_and_embedding: "Multimediainhalte einbinden",
      Multimedia_and_embedding_overview:
        "Multimediainhalte einbinden — Übersicht",
      Images_in_HTML: "Bilder in eine Webseite einbinden",
      Video_and_audio_content: "Video- und Audioinhalte",
      Other_embedding_technologies:
        "Von object zu iframe — weitere Einbindungsmöglichkeiten",
      Adding_vector_graphics_to_the_Web: "Vektor-Grafiken einbinden",
      Responsive_images: "Responsive Bilder",
      Assessment_Mozilla_splash_page: "Aufgabe: Neue Startseite für Mozilla",
      HTML_tables: "HTML-Tabellen",
      HTML_tables_overview: "HTML-Tabellen — Übersicht",
      HTML_table_basics: "HTML-Tabellen — Grundlagen",
      HTML_table_advanced: "HTML-Tabellen für Fortgeschrittene",
      Assessment_Structuring_planet_data:
        "Aufgabe: Tabelle der Planeten strukturieren",
      CSS_styling_the_Web: "CSS — Webseiten gestalten",
      CSS_first_steps: "CSS first steps",
      CSS_first_steps_overview: "CSS first steps overview",
      What_is_CSS: "What is CSS?",
      Getting_started_with_CSS: "Getting started with CSS",
      How_CSS_is_structured: "How CSS is structured",
      How_CSS_works: "How CSS works",
      Using_your_new_knowledge: "Using your new knowledge",
      CSS_building_blocks: "CSS building blocks",
      CSS_building_blocks_overview: "CSS building blocks overview",
      Cascade_and_inheritance: "Cascade and inheritance",
      CSS_selectors: "CSS selectors",
      The_box_model: "The box model",
      Backgrounds_and_borders: "Backgrounds and borders",
      Handling_different_text_directions: "Handling different text directions",
      Overflowing_content: "Overflowing content",
      Values_and_units: "Values and units",
      Sizing_items_in_CSS: "Sizing items in CSS",
      Images_media_and_form_elements: "Images, media, and form elements",
      Styling_tables: "Styling tables",
      Debugging_CSS: "Debugging CSS",
      Organizing_your_CSS: "Organizing your CSS",
      Styling_text: "Gestaltung von Text",
      Styling_text_overview: "Gestaltung von Text — Übersicht",
      Fundamental_text_and_font_styling: "Texte gestalten",
      Styling_lists: "Listen gestalten",
      Styling_links: "Links gestalten",
      Web_fonts: "Web-Schriftarten",
      Assessment_typesetting_a_community_school_homepage:
        "Aufgabe: Webseite für eine Schule",
      CSS_layout: "Layout mit CSS",
      CSS_layout_overview: "Layout mit CSS — Überblick",
      Normal_Flow: "Normal Flow",
      Flexbox: "Flexboxen",
      Grids: "Grid",
      Floats: "Float",
      Positioning: "Positionierung",
      "Multiple-column_Layout": "Multiple-column Layout",
      Responsive_design: "Responsive design",
      Media_queries: "Beginner's guide to media queries",
      Legacy_Layout_Methods: "Legacy Layout Methods",
      Supporting_Older_Browsers: "Supporting Older Browsers",
      Fundamental_Layout_Comprehension: "Fundamental Layout Comprehension",
      "JavaScript_dynamic_client-side_scripting":
        "JavaScript — dynamische, benutzerseitige Programmiersprache",
      JavaScript_first_steps: "Erste Schritte in JavaScript",
      JavaScript_first_steps_overview:
        "Erste Schritte in JavaScript — Übersicht",
      What_is_JavaScript: "Was ist JavaScript?",
      A_first_splash_into_JavaScript: "Ein erster Eindruck von JavaScript",
      What_went_wrong: "Wo ist der Fehler? Fehlersuche in JavaScript",
      Storing_the_information_you_need: "Variablen",
      Basic_math_in_JavaScript: "Zahlen und Mathematik in JavaScript",
      Handling_text: "Text in JavaScript - Strings",
      Useful_string_methods: "Nützliche Methoden für Strings",
      Arrays: "Arrays",
      Assessment_silly_story_generator:
        "Aufgabe: Generator für verrückte Geschichten",
      JavaScript_building_blocks: "Codeblöcke in JavaScript",
      JavaScript_building_blocks_overview:
        "Codeblöcke in JavaScript — Übersicht",
      Making_decisions_in_your_code: "Der Code entscheidet — if else Statement",
      Looping_code: "Schleifen im Code - for und while",
      Functions: "Funktionen - wiederverwendbare Codeblöcke",
      Build_your_own_function: "Bauen Sie Ihre eigene Funktion",
      Function_return_values: "return Wert einer Funktion",
      Introduction_to_events: "Einführung in Events",
      Assessment_image_gallery: "Aufgabe: Bildergalerie",
      Introducing_JavaScript_objects: "Einführung in JavaScript Objekte",
      Introducing_JavaScript_objects_overview:
        "Einführung in JavaScript Objekte — Übersicht",
      Object_basics: "Objekte — Grundlagen",
      "Object-oriented_JavaScript_for_beginners":
        "Objektorientierte Programmierung mit Javascript für Anfänger",
      Object_prototypes: "Prototypen in JavaScript",
      Inheritance_in_JavaScript: "Vererbung in JavaScript",
      Working_with_JSON_data: "Arbeiten mit JSON-Dateien",
      Object_building_practice:
        "Übungen zur objektorientierten Programmierung — Fliegende Bälle",
      Assessment_Adding_features_to_our_bouncing_balls_demo:
        "Aufgabe: Minispiel — Der böse Kreis zwischen den fliegenden Bällen",
      Asynchronous_JavaScript: "Asynchronous JavaScript",
      Asynchronous_JavaScript_overview: "Asynchronous JavaScript overview",
      General_asynchronous_programming_concepts:
        "General asynchronous programming concepts",
      Introducing_asynchronous_JavaScript:
        "Introducing asynchronous JavaScript",
      Timeouts_intervals:
        "Cooperative asynchronous Java​Script: Timeouts and intervals",
      Promises: "Graceful asynchronous programming with Promises",
      Async_await:
        "Making asynchronous programming easier with async and await",
      Choosing_the_right_approach: "Choosing the right approach",
      "Client-side_web_APIs": "Benutzerseitige Web-APIs",
      "Client-side_web_APIs_Introduction": "Einführung in Web-APIs",
      "Client-side_web_APIs_Manipulating_documents": "Dokumente manipulieren",
      "Client-side_web_APIs_Fetching_data": "Daten vom Server holen",
      "Client-side_web_APIs_Third_party_APIs": "APIs von Drittanbietern",
      "Client-side_web_APIs_Drawing_graphics": "Grafiken zeichnen",
      "Client-side_web_APIs_Video_and_audio_APIs": "Video und Audio APIs",
      "Client-side_web_APIs_client-side_storage": "Client-side storage",
      Web_forms: "Web forms — Working with user data",
      Web_forms_core: "Core forms learning pathway",
      Web_forms_overview: "Web forms overview",
      Your_first_form: "Your first form",
      How_to_structure_a_web_form: "How to structure a web form",
      Basic_native_form_controls: "Basic native form controls",
      The_HTML5_input_types: "The HTML5 input types",
      Other_form_controls: "Other form controls",
      Styling_web_forms: "Styling web forms",
      Advanced_form_styling: "Advanced form styling",
      "UI_pseudo-classes": "UI pseudo-classes",
      "Client-side_form_validation": "Client-side form validation",
      Sending_form_data: "Sending form data",
      Web_forms_advanced: "Advanced forms articles",
      How_to_build_custom_form_controls: "How to build custom form controls",
      Sending_forms_through_JavaScript: "Sending forms through JavaScript",
      CSS_property_compatibility_table_for_form_controls:
        "CSS property compatibility table for form controls",
      "Accessibility_—_Make_the_web_usable_by_everyone":
        "Barrierefreiheit — Das Internet für alle zugänglich machen",
      Accessibility_guides: "Guides zur Barrierefreiheit",
      Accessibility_assessment: "Aufgabe: Barrierefreiheit",
      Accessibility_overview: "Barrierefreiheit — Übersicht",
      What_is_accessibility: "Was ist Barrierefreiheit?",
      HTML_a_good_basis_for_accessibility:
        "HTML: Eine gute Basis für Barrierefreiheit",
      CSS_and_JavaScript_accessibility_best_practices:
        "CSS und JavaScript barrierefrei schreiben",
      "WAI-ARIA_basics": "WAI-ARIA Grundlagen",
      Accessible_multimedia: "Zugängliche Medieninhalte",
      Mobile_accessibility: "Mobile Zugänglichkeit",
      Assessment_Accessibility_troubleshooting:
        "Aufgabe: Probleme bei der Zugänglichkeit beheben",
      Tools_and_testing: "Werkzeuge und Tests",
      Cross_browser_testing: "Testen in verschiedenen Browsern",
      Cross_browser_testing_overview:
        "Testen in verschiedenen Browsern — Übersicht",
      Introduction_to_cross_browser_testing:
        "Einführung in das browserübergreifende Testen",
      Strategies_for_carrying_out_testing:
        "Strategien mit welchen Tests ausgeführt werden",
      Handling_common_HTML_and_CSS_problems:
        "Mit häufigen HTML und CSS Problemen umgehen",
      Handling_common_JavaScript_problems:
        "Mit häufigen JavaScript Problemen umgehen",
      Handling_common_accessibility_problems:
        "Mit häufigen Zugänglichkeitsproblemen umgehen",
      Implementing_feature_detection: "Einbauen von Feature-Erkennung",
      Introduction_to_automated_testing: "Einführung in automatisiertes Testen",
      Setting_up_your_own_test_automation_environment:
        "Setze deine eigene Testumgebung auf",
      Git_and_GitHub: "Git and GitHub",
      Git_and_GitHub_overview: "Git and GitHub overview",
      "Client-side_web_development_tools": "Client-side web development tools",
      "Client-side_web_development_tools_index":
        "Client-side web development tools index",
      "Client-side_tooling_overview": "Client-side tooling overview",
      Command_line_crash_course: "Command line crash course",
      Package_management_basics: "Package management basics",
      Introducing_a_complete_toolchain: "Introducing a complete toolchain",
      Deploying_our_app: "Deploying our app",
      "Introduction_to_client-side_frameworks":
        "Introduction to client-side frameworks",
      "Client-side_frameworks_overview": "Client-side frameworks overview",
      Framework_main_features: "Framework main features",
      React: "React",
      Getting_started_with_React: "Getting started with React",
      Beginning_our_React_todo_list: "Beginning our React todo list",
      Componentizing_our_React_app: "Componentizing our React app",
      "React_interactivity:_Events_and_state":
        "React interactivity: Events and state",
      "React_interactivity:_Editing_filtering_conditional_rendering":
        "React interactivity: Editing, filtering, conditional rendering",
      Accessibility_in_React: "Accessibility in React",
      React_resources: "React resources",
      Ember: "Ember",
      Getting_started_with_Ember: "Getting started with Ember",
      Ember_app_structure_and_componentization:
        "Ember app structure and componentization",
      "Ember_interactivity:_Events_classes_and_state":
        "Ember interactivity: Events, classes and state",
      "Ember_Interactivity:_Footer_functionality_conditional_rendering":
        "Ember Interactivity: Footer functionality, conditional rendering",
      Routing_in_Ember: "Routing in Ember",
      Ember_resources_and_troubleshooting:
        "Ember resources and troubleshooting",
      Vue: "Vue",
      Getting_started_with_Vue: "Getting started with Vue",
      Creating_our_first_Vue_component: "Creating our first Vue component",
      Rendering_a_list_of_Vue_components: "Rendering a list of Vue components",
      "Adding_a_new_todo_form:_Vue_events_methods_and_models":
        "Adding a new todo form: Vue events, methods, and models",
      Styling_Vue_components_with_CSS: "Styling Vue components with CSS",
      Using_Vue_computed_properties: "Using Vue computed properties",
      "Vue_conditional_rendering:_editing_existing_todos":
        "Vue conditional rendering: editing existing todos",
      Focus_management_with_Vue_refs: "Focus management with Vue refs",
      Vue_resources: "Vue resources",
      Svelte: "Svelte",
      Getting_started_with_Svelte: "Getting started with Svelte",
      Starting_our_Svelte_Todo_list_app: "Starting our Svelte Todo list app",
      "Dynamic_behavior_in_Svelte:_working_with_variables_and_props":
        "Dynamic behavior in Svelte: working with variables and props",
      Componentizing_our_Svelte_app: "Componentizing our Svelte app",
      "Advanced_Svelte:_Reactivity_lifecycle_accessibility":
        "Advanced Svelte: Reactivity, lifecycle, accessibility",
      Working_with_Svelte_stores: "Working with Svelte stores",
      TypeScript_support_in_Svelte: "TypeScript support in Svelte",
      Deployment_and_next_steps: "Deployment and next steps",
      "Server-side_website_programming":
        "Serverseitige Webseitenprogrammierung",
      First_steps: "Erste Schritte",
      First_steps_overview: "Erste Schritte — Übersicht",
      "Introduction_to_the_server-side": "Einführung in die Serverseite",
      "Client-Server_overview": "Client - Server Übersicht",
      "Server-side_web_frameworks": "Serverseitige Webframeworks",
      Website_security: "Sicherheit auf Webseiten",
      "Django_web_framework_(Python)": "Django Webframework (Python)",
      "Django_web_framework_(Python)_overview":
        "Django Webframework (Python) — Übersicht",
      Django_introduction: "Einführung",
      Setting_up_a_development_environment: "Entwicklungsumgebung aufsetzen",
      Tutorial_The_Local_Library_website:
        "Tutorial Teil 1: Die lokale Bibliothek",
      Tutorial_Part_2_Creating_a_skeleton_website:
        "Tutorial Teil 2: Grundgerüst der Webseite",
      Tutorial_Part_3_Using_models: "Tutorial Teil 3: Modelle benutzen",
      Tutorial_Part_4_Django_admin_site: "Tutorial Teil 4: Django Admin Seite",
      Tutorial_Part_5_Creating_our_home_page:
        "Tutorial Teil 5: Die Homepage erstellen",
      Tutorial_Part_6_Generic_list_and_detail_views:
        "Tutorial Teil 6: Listen und detaillierte Ansichten",
      Tutorial_Part_7_Sessions_framework: "Tutorial Teil 7: Session Framework",
      Tutorial_Part_8_User_authentication_and_permissions:
        "Tutorial Teil 8: Benutzer Authentifizierung und Rechte",
      Tutorial_Part_9_Working_with_forms: "Tutorial Teil 9: Formulare",
      Tutorial_Part_10_Testing_a_Django_web_application:
        "Tutorial Teil 10: Testen einer Django Web-Applikation",
      Tutorial_Part_11_Deploying_Django_to_production:
        "Tutorial Teil 11: Die fertige Django-App ausliefern",
      Web_application_security: "Sicherheit bei Webapps",
      Assessment_DIY_mini_blog: "Aufgabe: Erstellen eines Mini-Blogs",
      "Express_Web_Framework_(Node.js_JavaScript)":
        "Express Web Framework (node.js/JavaScript)",
      "Express_Web_Framework_(Node.js_JavaScript)_overview":
        "Express Web Framework (Node.js/JavaScript) — Übersicht",
      Express_Node_introduction: "Express/Node Einführung",
      "Setting_up_a_Node_(Express)_development_environment":
        "Eine Node(Express)-Entwicklungsumgebung aufsetzen",
      Express_Tutorial_The_Local_Library_website:
        "Express Tutorial Teil 1: Die lokale Bibliothek",
      Express_Tutorial_Part_2_Creating_a_skeleton_website:
        "Express Tutorial Teil 2: Grundgerüst der Webseite",
      "Express_Tutorial_Part_3_Using_a_database_(with_Mongoose)":
        "Express Tutorial Teil 3: Datenbank nutzen (mit Mongoose)",
      Express_Tutorial_Part_4_Routes_and_controllers:
        "Express Tutorial Teil 4: Routes und Controllers",
      Express_Tutorial_Part_5_Displaying_library_data:
        "Express Tutorial Teil 5: Daten aus der Bibliothek anzeigen",
      Express_Tutorial_Part_6_Working_with_forms:
        "Express Tutorial Teil 6: Mit Formularen arbeiten",
      Express_Tutorial_Part_7_Deploying_to_production:
        "Express Tutorial Teil 7: Die fertige App ausliefern",
      Further_resources: "Weitere Ressourcen",
      Common_questions: "Häufige Fragen",
      HTML_questions: "Fragen zu HTML",
      CSS_questions: "Fragen zu CSS",
      Web_mechanics: "Wie das Internet funktioniert",
      Tools_and_setup: "Werkzeuge und Arbeitsumgebungen",
      Design_and_accessibility: "Design und Zugänglichkeit",
    },
    "pt-BR": {
      Complete_beginners: "Completos iniciantes, comecem por aqui!",
      Getting_started_with_the_web: "Iniciando na Internet",
      Getting_started_with_the_web_overview:
        "Visão geral sobre Iniciando na Internet",
      Installing_basic_software: "Instalação dos softwares básicos",
      What_will_your_website_look_like: "Como será seu site?",
      Dealing_with_files: "Lidando com arquivos",
      HTML_basics: "O básico de HTML",
      CSS_basics: "O básico de CSS",
      JavaScript_basics: "O básico de JavaScript",
      Publishing_your_website: "Publicando seu site",
      How_the_Web_works: "Como a Internet funciona",
      HTML_structuring_the_Web: "HTML — Estruturando a Web",
      Introduction_to_HTML: "Introdução ao HTML",
      Introduction_to_HTML_overview: "Visão geral da Introdução ao HTML",
      Getting_started_with_HTML: "Iniciando em HTML",
      Whats_in_the_head_metadata_in_HTML:
        'O que está no "head"? Metadados em HTML',
      HTML_text_fundamentals: "Fundamentos de Textos HTML",
      Creating_hyperlinks: "Criando hiperlinks",
      Advanced_text_formatting: "Formatação avançada de textos",
      Document_and_website_structure: "Estrutura de Documentos e Sites",
      Debugging_HTML: "Depurando HTML",
      Assessment_marking_up_a_letter: "Avaliação: Marcando uma carta",
      Assessment_structuring_a_page_of_content:
        "Avaliação: Estruturação de uma página de conteúdo",
      Multimedia_and_embedding: "Multimídia e incorporação",
      Multimedia_and_embedding_overview:
        "Visão geral sobre Multimídia e incorporação",
      Images_in_HTML: "Imagens em HTML",
      Video_and_audio_content: "Conteúdos em Vídeo e áudio",
      Other_embedding_technologies:
        "De objeto a iframe — outras tecnologias de incorporação",
      Adding_vector_graphics_to_the_Web: "Adicionando vetores gráficos na Web",
      Responsive_images: "Imagens responsivas",
      Assessment_Mozilla_splash_page:
        "Avaliação: Página de abertura da Mozilla",
      HTML_tables: "Tabelas HTML",
      HTML_tables_overview: "Visão geral sobre tabelas HTML",
      HTML_table_basics: "O básico sobre Tabelas HTML",
      HTML_table_advanced:
        "Funcionalidades avançadas e acessibilidade de Tabelas HTML",
      Assessment_Structuring_planet_data:
        "Avaliação: Estruturação dos dados do planenta",
      CSS_styling_the_Web: "CSS — Estilizando a Web",
      CSS_first_steps: "CSS - primeiros passos",
      CSS_first_steps_overview: "Visão geral das primeiras etapas com CSS",
      What_is_CSS: "O que é CSS?",
      Getting_started_with_CSS: "Iniciando com CSS",
      How_CSS_is_structured: "como CSS é estruturado",
      How_CSS_works: "Como CSS funciona",
      Using_your_new_knowledge: "Usando seu novo Conhecimento",
      CSS_building_blocks: "CSS building blocks",
      CSS_building_blocks_overview: "CSS building blocks overview",
      Cascade_and_inheritance: "Cascade and inheritance",
      CSS_selectors: "seletores CSS",
      The_box_model: "The box model",
      Backgrounds_and_borders: "Backgrounds and borders",
      Handling_different_text_directions:
        "Tratamento de diferentes direções de texto",
      Overflowing_content: "Overflowing content",
      Values_and_units: "Valores e unidades",
      Sizing_items_in_CSS: "Dimensionando itens em CSS",
      Images_media_and_form_elements: "Images, media, and form elements",
      Styling_tables: "Estilização de tabelas",
      Debugging_CSS: "Debugging CSS",
      Organizing_your_CSS: "Organize seu CSS",
      Styling_text: "Estilização de textos",
      Styling_text_overview: "Visão geral da Estilização de textos",
      Fundamental_text_and_font_styling:
        "Fundamentos da estilização de textos e fontes",
      Styling_lists: "Estilização de listas",
      Styling_links: "Estilização de links",
      Web_fonts: "Fontes Web",
      Assessment_typesetting_a_community_school_homepage:
        "Avaliação: Tipografia para a página inicial da escola pública local",
      CSS_layout: "Esquemas CSS",
      CSS_layout_overview: "Visão geral de esquemas CSS",
      Layout_introduction: "Introdução a esquemas CSS",
      Normal_Flow: "Normal Flow",
      Flexbox: "Flexbox",
      Grids: "Grids",
      Floats: '"Floats" - Flutuando elementos',
      Positioning: "Posicionamento",
      "Multiple-column_Layout": "Multiple-column Layout",
      Responsive_design: "Responsive design",
      Media_queries: "Beginner's guide to media queries",
      Legacy_Layout_Methods: "Legacy Layout Methods",
      Supporting_Older_Browsers: "Supporting Older Browsers",
      Fundamental_Layout_Comprehension: "Fundamental Layout Comprehension",
      "JavaScript_dynamic_client-side_scripting":
        "JavaScript — Uma linguagem de script dinâmica para aplicações cliente",
      JavaScript_first_steps: "Primeiros passos com JavaScript",
      JavaScript_first_steps_overview:
        "Visão geral dos Primeiros passos com JavaScript",
      What_is_JavaScript: "O que é JavaScript?",
      A_first_splash_into_JavaScript: "Um primeiro olhar em JavaScript",
      What_went_wrong: "O que deu errado? Solução de problemas de JavaScript",
      Storing_the_information_you_need:
        "Guardando a informação que precisa — Variáveis",
      Basic_math_in_JavaScript: "Básico de JavaScript — Números e operadores",
      Handling_text: "Lidando com textos — Strings em JavaScript",
      Useful_string_methods: "Métodos de String úteis",
      Arrays: '"Arrays" — Arranjos',
      Assessment_silly_story_generator: "Avaliação: Gerador de estórias bobas",
      JavaScript_building_blocks: "Programando em JavaScript",
      JavaScript_building_blocks_overview:
        "Visão geral de Programando em JavaScript",
      Making_decisions_in_your_code:
        "Tomando decisões no seu código — Condicionais",
      Looping_code: "Código de repetição",
      Functions: "Funções — Blocos de códigos reutilizáveis",
      Build_your_own_function: "Construa sua própria função",
      Function_return_values: "Retorno de valores em funções",
      Introduction_to_events: "Introdução a eventos",
      Assessment_image_gallery: "Avaliação: Galeria de imagens",
      Introducing_JavaScript_objects: "Introdução Objetos em JavaScript",
      Introducing_JavaScript_objects_overview:
        "Visão geral de Objetos em JavaScript",
      Object_basics: "O básico de Objetos",
      "Object-oriented_JavaScript_for_beginners":
        "Orientação a Objetos em JavaScript para iniciantes",
      Object_prototypes: '"Prototypes" de objetos',
      Inheritance_in_JavaScript: "Herança em JavaScript",
      Working_with_JSON_data: "Trabalhando com dados em JSON",
      Object_building_practice: "Prática de construção de objetos",
      Assessment_Adding_features_to_our_bouncing_balls_demo:
        "Avaliação: Adicionando funcionalidades ao nosso aplicativo Bolas Saltitantes",
      Asynchronous_JavaScript: "Asynchronous JavaScript",
      Asynchronous_JavaScript_overview: "Asynchronous JavaScript overview",
      General_asynchronous_programming_concepts:
        "General asynchronous programming concepts",
      Introducing_asynchronous_JavaScript:
        "Introducing asynchronous JavaScript",
      Timeouts_intervals:
        "Cooperative asynchronous Java​Script: Timeouts and intervals",
      Promises: "Graceful asynchronous programming with Promises",
      Async_await:
        "Making asynchronous programming easier with async and await",
      Choosing_the_right_approach: "Choosing the right approach",
      "Client-side_web_APIs": "APIs Web na aplicação Cliente",
      "Client-side_web_APIs_Introduction": "Introdução a APIs Web",
      "Client-side_web_APIs_Manipulating_documents": "Manipulando documentos",
      "Client-side_web_APIs_Fetching_data": "Pegando dados do servidor",
      "Client-side_web_APIs_Third_party_APIs": "APIs de Terceiros",
      "Client-side_web_APIs_Drawing_graphics": "Desenhando gráficos",
      "Client-side_web_APIs_Video_and_audio_APIs": "APIs de Vídeo e Áudio",
      "Client-side_web_APIs_client-side_storage":
        "Armazenamento na aplicação cliente",
      Web_forms: "Web forms — Working with user data",
      Web_forms_core: "Core forms learning pathway",
      Web_forms_overview: "Web forms overview",
      Your_first_form: "Your first form",
      How_to_structure_a_web_form: "How to structure a web form",
      Basic_native_form_controls: "Basic native form controls",
      The_HTML5_input_types: "The HTML5 input types",
      Other_form_controls: "Other form controls",
      Styling_web_forms: "Styling web forms",
      Advanced_form_styling: "Advanced form styling",
      "UI_pseudo-classes": "UI pseudo-classes",
      "Client-side_form_validation": "Client-side form validation",
      Sending_form_data: "Sending form data",
      Web_forms_advanced: "Advanced forms articles",
      How_to_build_custom_form_controls: "How to build custom form controls",
      Sending_forms_through_JavaScript: "Sending forms through JavaScript",
      CSS_property_compatibility_table_for_form_controls:
        "CSS property compatibility table for form controls",
      "Accessibility_—_Make_the_web_usable_by_everyone":
        "Acessibilidade — Faça a Internet usável por qualquer pessoa",
      Accessibility_guides: "Guias de acessibilidade",
      Accessibility_assessment: "Avaliando a acessibilidade",
      Accessibility_overview: "Visão geral sobre Acessibilidade",
      What_is_accessibility: "O que é acessibilidade?",
      HTML_a_good_basis_for_accessibility:
        "HTML: Uma boa base para acessibilidade",
      CSS_and_JavaScript_accessibility_best_practices:
        "Melhores práticas para acessibilidade em CSS e JavaScript",
      "WAI-ARIA_basics": "O básico de WAI-ARIA",
      Accessible_multimedia: "Multimídia acessível",
      Mobile_accessibility: "Acessibilidade em dispositivos móveis",
      Assessment_Accessibility_troubleshooting:
        "Avaliação: Solução de problemas de Acessibilidade",
      Tools_and_testing: "Ferramentas e teste",
      Cross_browser_testing: "Testes entre navegadores",
      Cross_browser_testing_overview: "Visão geral de testes entre navegadores",
      Introduction_to_cross_browser_testing:
        "Introdução a testes entre navegadores",
      Strategies_for_carrying_out_testing:
        "Estratégias para execução de testes",
      Handling_common_HTML_and_CSS_problems:
        "Lidando com problemas comuns de HTML e CSS",
      Handling_common_JavaScript_problems:
        "Lidando com problemas comuns de JavaScript",
      Handling_common_accessibility_problems:
        "Lidando com problemas comuns de acessibilidade",
      Implementing_feature_detection:
        "Implementando detecção de funcionalidade",
      Introduction_to_automated_testing: "Introdução a testes automatizados",
      Setting_up_your_own_test_automation_environment:
        "Configurando seu próprio ambiente de testes automatizados",
      Git_and_GitHub: "Git and GitHub",
      Git_and_GitHub_overview: "Git and GitHub overview",
      "Client-side_web_development_tools": "Client-side web development tools",
      "Client-side_web_development_tools_index":
        "Client-side web development tools index",
      "Client-side_tooling_overview": "Client-side tooling overview",
      Command_line_crash_course: "Command line crash course",
      Package_management_basics: "Package management basics",
      Introducing_a_complete_toolchain: "Introducing a complete toolchain",
      Deploying_our_app: "Deploying our app",
      "Introduction_to_client-side_frameworks":
        "Introduction to client-side frameworks",
      "Client-side_frameworks_overview": "Client-side frameworks overview",
      Framework_main_features: "Framework main features",
      React: "React",
      Getting_started_with_React: "Getting started with React",
      Beginning_our_React_todo_list: "Beginning our React todo list",
      Componentizing_our_React_app: "Componentizing our React app",
      "React_interactivity:_Events_and_state":
        "React interactivity: Events and state",
      "React_interactivity:_Editing_filtering_conditional_rendering":
        "React interactivity: Editing, filtering, conditional rendering",
      Accessibility_in_React: "Accessibility in React",
      React_resources: "React resources",
      Ember: "Ember",
      Getting_started_with_Ember: "Getting started with Ember",
      Ember_app_structure_and_componentization:
        "Ember app structure and componentization",
      "Ember_interactivity:_Events_classes_and_state":
        "Ember interactivity: Events, classes and state",
      "Ember_Interactivity:_Footer_functionality_conditional_rendering":
        "Ember Interactivity: Footer functionality, conditional rendering",
      Routing_in_Ember: "Routing in Ember",
      Ember_resources_and_troubleshooting:
        "Ember resources and troubleshooting",
      Vue: "Vue",
      Getting_started_with_Vue: "Getting started with Vue",
      Creating_our_first_Vue_component: "Creating our first Vue component",
      Rendering_a_list_of_Vue_components: "Rendering a list of Vue components",
      "Adding_a_new_todo_form:_Vue_events_methods_and_models":
        "Adding a new todo form: Vue events, methods, and models",
      Styling_Vue_components_with_CSS: "Styling Vue components with CSS",
      Using_Vue_computed_properties: "Using Vue computed properties",
      "Vue_conditional_rendering:_editing_existing_todos":
        "Vue conditional rendering: editing existing todos",
      Focus_management_with_Vue_refs: "Focus management with Vue refs",
      Vue_resources: "Vue resources",
      Svelte: "Svelte",
      Getting_started_with_Svelte: "Getting started with Svelte",
      Starting_our_Svelte_Todo_list_app: "Starting our Svelte Todo list app",
      "Dynamic_behavior_in_Svelte:_working_with_variables_and_props":
        "Dynamic behavior in Svelte: working with variables and props",
      Componentizing_our_Svelte_app: "Componentizing our Svelte app",
      "Advanced_Svelte:_Reactivity_lifecycle_accessibility":
        "Advanced Svelte: Reactivity, lifecycle, accessibility",
      Working_with_Svelte_stores: "Working with Svelte stores",
      TypeScript_support_in_Svelte: "TypeScript support in Svelte",
      Deployment_and_next_steps: "Deployment and next steps",
      "Server-side_website_programming":
        "Programação de servidores de Aplicação",
      First_steps: "Primeiros passos",
      First_steps_overview: "Visão geral para os primeiros passos",
      "Introduction_to_the_server-side": "Introdução ao Servidor de Aplicação",
      "Client-Server_overview": "Visão geral da arquitetura Cliente-Servidor",
      "Server-side_web_frameworks":
        "Frameworks Web para o Servidor de Aplicação",
      Website_security: "Segurança de sites",
      "Django_web_framework_(Python)": "Framework Web Django (Python)",
      "Django_web_framework_(Python)_overview":
        "Visão geral do Framework Web Django (Python)",
      Django_introduction: "Introdução",
      Setting_up_a_development_environment:
        "Configurando um ambiente de desenvolvimento para aplicações Django",
      Tutorial_The_Local_Library_website:
        "Tutorial: Um site para a Biblioteca Local",
      Tutorial_Part_2_Creating_a_skeleton_website:
        "Tutorial Parte 2: Criando o esqueleto de um site",
      Tutorial_Part_3_Using_models: 'Tutorial Parte 3: Usando "models"',
      Tutorial_Part_4_Django_admin_site:
        "Tutorial Parte 4: Um site administrativo em Django",
      Tutorial_Part_5_Creating_our_home_page:
        "Tutorial Parte 5: Criando nossa página inicial",
      Tutorial_Part_6_Generic_list_and_detail_views:
        "Tutorial Parte 6: Páginas de lista genérica e detalhamento",
      Tutorial_Part_7_Sessions_framework:
        "Tutorial Parte 7: Framework de sessões",
      Tutorial_Part_8_User_authentication_and_permissions:
        "Tutorial Parte 8: Autenticação e permissões de usuário",
      Tutorial_Part_9_Working_with_forms:
        "Tutorial Part 9: Trabalhando com formulários",
      Tutorial_Part_10_Testing_a_Django_web_application:
        "Tutorial Parte 10: Testando aplicações web em Django",
      Tutorial_Part_11_Deploying_Django_to_production:
        "Tutorial Parte 11: Implantando Django em produção",
      Web_application_security: "Segurança de Aplicações Web",
      Assessment_DIY_mini_blog: "Avaliação: Faça você mesmo: Um blog pessoal",
      "Express_Web_Framework_(Node.js_JavaScript)":
        "Framework Web Express (Node.js/JavaScript)",
      "Express_Web_Framework_(Node.js_JavaScript)_overview":
        "Visão geral do Framework Web Express (Node.js/JavaScript)",
      Express_Node_introduction: "Introdução a Express/Node",
      "Setting_up_a_Node_(Express)_development_environment":
        "Configurando um ambiente de desenvolvimento Node (Express)",
      Express_Tutorial_The_Local_Library_website:
        "Tutorial Rápido: Um site para a Biblioteca Local",
      Express_Tutorial_Part_2_Creating_a_skeleton_website:
        "Tutorial Rápido Parte 2: Criando o esqueleto de um site",
      "Express_Tutorial_Part_3_Using_a_database_(with_Mongoose)":
        "Tutorial Rápido Parte 3: Usando um banco de dados (com Mongoose)",
      Express_Tutorial_Part_4_Routes_and_controllers:
        'Tutorial Rápido Parte 4: Rotas e "controllers"',
      Express_Tutorial_Part_5_Displaying_library_data:
        "Tutorial Rápido Parte 5: Mostrando os dados da Biblioteca",
      Express_Tutorial_Part_6_Working_with_forms:
        "Tutorial Rápido Parte 6: Trabalhando com formulários",
      Express_Tutorial_Part_7_Deploying_to_production:
        "Tutorial Rápido Parte 7: Implantando em produção",
      Further_resources: "Mais recursos",
      Common_questions: "Questões gerais",
      HTML_questions: "Questões sobre HTML",
      CSS_questions: "Questões sobre CSS",
      JavaScript_questions: "Questões sobre JavaScript",
      Web_mechanics: "Como a Internet funciona",
      Tools_and_setup: "Ferramentas e configuração",
      Design_and_accessibility: "Projeto e acessibilidade",
    },
    ru: {
      Complete_beginners: "Новички начинают здесь!",
      Getting_started_with_the_web: "Начало работы с Вебом",
      Getting_started_with_the_web_overview: "Начало работы с Вебом",
      Installing_basic_software: "Установка базового программного обеспечения",
      What_will_your_website_look_like: "Каким должен быть ваш веб-сайт?",
      Dealing_with_files: "Работа с файлами",
      HTML_basics: "Основы HTML",
      CSS_basics: "Основы CSS",
      JavaScript_basics: "Основы JavaScript",
      Publishing_your_website: "Публикация вашего веб-сайта",
      How_the_Web_works: "Как работает Веб",
      HTML_structuring_the_Web: "HTML — структура Веба",
      Introduction_to_HTML: "Вступление в HTML",
      Introduction_to_HTML_overview: "Вступление в HTML",
      Getting_started_with_HTML: "Начало работы с HTML",
      Whats_in_the_head_metadata_in_HTML: 'Что в "шапке"? Метаданные в HTML',
      HTML_text_fundamentals: "Тексты в HTML",
      Creating_hyperlinks: "Создание гиперссылок",
      Advanced_text_formatting: "Продвинутое форматирование текста",
      Document_and_website_structure: "Структура документа и веб-сайта",
      Debugging_HTML: "Отладка HTML",
      Assessment_marking_up_a_letter: "Задание: Выделение символа",
      Assessment_structuring_a_page_of_content: "Задание: Структура страницы",
      Multimedia_and_embedding: "Мультимедиа и встраивание",
      Multimedia_and_embedding_overview: "Мультимедиа и встраивание",
      Images_in_HTML: "Изображения в HTML",
      Video_and_audio_content: "Видео и аудио контент",
      Other_embedding_technologies:
        "От object до iframe — другие технологии встраивания",
      Adding_vector_graphics_to_the_Web: "Добавление векторный графики в Веб",
      Responsive_images: "Отзывчивые изображения",
      Assessment_Mozilla_splash_page: "Задание: Страница о Mozilla",
      CSS_styling_the_Web: "CSS — стилизирование Веба",
      CSS_first_steps: "CSS first steps",
      CSS_first_steps_overview: "CSS first steps overview",
      What_is_CSS: "What is CSS?",
      Getting_started_with_CSS: "Getting started with CSS",
      How_CSS_is_structured: "How CSS is structured",
      How_CSS_works: "How CSS works",
      Using_your_new_knowledge: "Using your new knowledge",
      CSS_building_blocks: "CSS building blocks",
      CSS_building_blocks_overview: "CSS building blocks overview",
      Cascade_and_inheritance: "Cascade and inheritance",
      CSS_selectors: "CSS selectors",
      The_box_model: "The box model",
      Backgrounds_and_borders: "Backgrounds and borders",
      Handling_different_text_directions: "Handling different text directions",
      Overflowing_content: "Overflowing content",
      Values_and_units: "Values and units",
      Sizing_items_in_CSS: "Sizing items in CSS",
      Images_media_and_form_elements: "Images, media, and form elements",
      Styling_tables: "Styling tables",
      Debugging_CSS: "Debugging CSS",
      Organizing_your_CSS: "Organizing your CSS",
      Styling_text: "Стилизирование текста",
      Styling_text_overview: "Стилизирование текста",
      Fundamental_text_and_font_styling:
        "Основы стилизирования текста и шрифта",
      Styling_lists: "Стилизирование списков",
      Styling_links: "Стилизирование ссылок",
      Web_fonts: "Веб-шрифты",
      Assessment_typesetting_a_community_school_homepage:
        "Задание: Стилизирование школьного сайта",
      CSS_layout: "CSS макет",
      CSS_layout_overview: "CSS макет",
      Normal_Flow: "Normal Flow",
      Flexbox: "Flexbox",
      Grids: "Сетки",
      Floats: "Float",
      Positioning: "Позиционирование",
      "Multiple-column_Layout": "Multiple-column Layout",
      Responsive_design: "Responsive design",
      Media_queries: "Beginner's guide to media queries",
      Legacy_Layout_Methods: "Legacy Layout Methods",
      Supporting_Older_Browsers: "Supporting Older Browsers",
      Fundamental_Layout_Comprehension: "Fundamental Layout Comprehension",
      "JavaScript_dynamic_client-side_scripting":
        "JavaScript — динамический клиентский скриптинг",
      JavaScript_first_steps: "Первые шаги в JavaScript",
      JavaScript_first_steps_overview: "Первые шаги в JavaScript",
      What_is_JavaScript: "Что такое JavaScript?",
      A_first_splash_into_JavaScript: "Первое погружение в JavaScript",
      What_went_wrong: "Что-то пошло не так? Устранение ошибок JavaScript",
      Storing_the_information_you_need:
        "Хранение нужной информации — Переменные",
      Basic_math_in_JavaScript: "Основы JavaScript — Числа и операторы",
      Handling_text: "Работа с текстом — Строки в JavaScript",
      Useful_string_methods: "Полезные методы для строк",
      Arrays: "Массивы",
      Assessment_silly_story_generator: "Задание: Генератор глупых историй",
      JavaScript_building_blocks: "Блоки в JavaScript",
      JavaScript_building_blocks_overview: "Блоки в JavaScript",
      Making_decisions_in_your_code: "Делаем решения в вашем годе — Условия",
      Looping_code: "Повторение кода",
      Functions: "Функции — Переиспользуемые блоки кода",
      Build_your_own_function: "Создаём свою функцию",
      Function_return_values: "Возвращаемые значения функций",
      Introduction_to_events: "Введение в события",
      Assessment_image_gallery: "Задание: Галерея изображений",
      Introducing_JavaScript_objects: "Введение в объекты JavaScript",
      Introducing_JavaScript_objects_overview: "Введение в объекты JavaScript",
      Object_basics: "Основы объектов",
      "Object-oriented_JavaScript_for_beginners":
        "Объектно-ориентированный JavaScript для новичков",
      Object_prototypes: "Прототипы объектов",
      Inheritance_in_JavaScript: "Наследование в JavaScript",
      Working_with_JSON_data: "Работа с JSON данными",
      Object_building_practice: "Практика по созданию объектов",
      Assessment_Adding_features_to_our_bouncing_balls_demo:
        "Задание: Добавление возможностей в пример с прыгающими шарами",
      Asynchronous_JavaScript: "Asynchronous JavaScript",
      Asynchronous_JavaScript_overview: "Asynchronous JavaScript overview",
      General_asynchronous_programming_concepts:
        "General asynchronous programming concepts",
      Introducing_asynchronous_JavaScript:
        "Introducing asynchronous JavaScript",
      Timeouts_intervals:
        "Cooperative asynchronous Java​Script: Timeouts and intervals",
      Promises: "Graceful asynchronous programming with Promises",
      Async_await:
        "Making asynchronous programming easier with async and await",
      Choosing_the_right_approach: "Choosing the right approach",
      "Client-side_web_APIs": "Client-side web APIs",
      "Client-side_web_APIs_Introduction": "Introduction to web APIs",
      "Client-side_web_APIs_Manipulating_documents": "Manipulating documents",
      "Client-side_web_APIs_Fetching_data": "Fetching data from the server",
      "Client-side_web_APIs_Third_party_APIs": "Third party APIs",
      "Client-side_web_APIs_Drawing_graphics": "Drawing graphics",
      "Client-side_web_APIs_Video_and_audio_APIs": "Video and audio APIs",
      "Client-side_web_APIs_client-side_storage": "Client-side storage",
      Web_forms: "Web forms — Working with user data",
      Web_forms_core: "Core forms learning pathway",
      Web_forms_overview: "Web forms overview",
      Your_first_form: "Your first form",
      How_to_structure_a_web_form: "How to structure a web form",
      Basic_native_form_controls: "Basic native form controls",
      The_HTML5_input_types: "The HTML5 input types",
      Other_form_controls: "Other form controls",
      Styling_web_forms: "Styling web forms",
      Advanced_form_styling: "Advanced form styling",
      "UI_pseudo-classes": "UI pseudo-classes",
      "Client-side_form_validation": "Client-side form validation",
      Sending_form_data: "Sending form data",
      Web_forms_advanced: "Advanced forms articles",
      How_to_build_custom_form_controls: "How to build custom form controls",
      Sending_forms_through_JavaScript: "Sending forms through JavaScript",
      CSS_property_compatibility_table_for_form_controls:
        "CSS property compatibility table for form controls",
      Tools_and_testing: "Инструменты и тестирование",
      Cross_browser_testing: "Кроссбраузерное тестирование",
      Cross_browser_testing_overview: "Кроссбраузерное тестирование",
      Introduction_to_cross_browser_testing:
        "Вступление в кроссбраузерное тестирование",
      Strategies_for_carrying_out_testing: "Стратегии выполнения тестирования",
      Handling_common_HTML_and_CSS_problems:
        "Решение частых проблем с HTML и CSS",
      Handling_common_JavaScript_problems:
        "Решение частых проблем с JavaScript",
      Handling_common_accessibility_problems:
        "Решение частых проблем доступности",
      Implementing_feature_detection: "Проверка поддержки возможностей",
      Introduction_to_automated_testing:
        "Вступление в автоматическое тестирование",
      Setting_up_your_own_test_automation_environment:
        "Установка вашей автоматической среды тестирования",
      Git_and_GitHub: "Git and GitHub",
      Git_and_GitHub_overview: "Git and GitHub overview",
      "Client-side_web_development_tools": "Client-side web development tools",
      "Client-side_web_development_tools_index":
        "Client-side web development tools index",
      "Client-side_tooling_overview": "Client-side tooling overview",
      Command_line_crash_course: "Command line crash course",
      Package_management_basics: "Package management basics",
      Introducing_a_complete_toolchain: "Introducing a complete toolchain",
      Deploying_our_app: "Deploying our app",
      "Introduction_to_client-side_frameworks":
        "Introduction to client-side frameworks",
      "Client-side_frameworks_overview": "Client-side frameworks overview",
      Framework_main_features: "Framework main features",
      React: "React",
      Getting_started_with_React: "Getting started with React",
      Beginning_our_React_todo_list: "Beginning our React todo list",
      Componentizing_our_React_app: "Componentizing our React app",
      "React_interactivity:_Events_and_state":
        "React interactivity: Events and state",
      "React_interactivity:_Editing_filtering_conditional_rendering":
        "React interactivity: Editing, filtering, conditional rendering",
      Accessibility_in_React: "Accessibility in React",
      React_resources: "React resources",
      Ember: "Ember",
      Getting_started_with_Ember: "Getting started with Ember",
      Ember_app_structure_and_componentization:
        "Ember app structure and componentization",
      "Ember_interactivity:_Events_classes_and_state":
        "Ember interactivity: Events, classes and state",
      "Ember_Interactivity:_Footer_functionality_conditional_rendering":
        "Ember Interactivity: Footer functionality, conditional rendering",
      Routing_in_Ember: "Routing in Ember",
      Ember_resources_and_troubleshooting:
        "Ember resources and troubleshooting",
      Vue: "Vue",
      Getting_started_with_Vue: "Getting started with Vue",
      Creating_our_first_Vue_component: "Creating our first Vue component",
      Rendering_a_list_of_Vue_components: "Rendering a list of Vue components",
      "Adding_a_new_todo_form:_Vue_events_methods_and_models":
        "Adding a new todo form: Vue events, methods, and models",
      Styling_Vue_components_with_CSS: "Styling Vue components with CSS",
      Using_Vue_computed_properties: "Using Vue computed properties",
      "Vue_conditional_rendering:_editing_existing_todos":
        "Vue conditional rendering: editing existing todos",
      Focus_management_with_Vue_refs: "Focus management with Vue refs",
      Vue_resources: "Vue resources",
      Svelte: "Svelte",
      Getting_started_with_Svelte: "Getting started with Svelte",
      Starting_our_Svelte_Todo_list_app: "Starting our Svelte Todo list app",
      "Dynamic_behavior_in_Svelte:_working_with_variables_and_props":
        "Dynamic behavior in Svelte: working with variables and props",
      Componentizing_our_Svelte_app: "Componentizing our Svelte app",
      "Advanced_Svelte:_Reactivity_lifecycle_accessibility":
        "Advanced Svelte: Reactivity, lifecycle, accessibility",
      Working_with_Svelte_stores: "Working with Svelte stores",
      TypeScript_support_in_Svelte: "TypeScript support in Svelte",
      Deployment_and_next_steps: "Deployment and next steps",
      Angular: "Angular",
      Getting_started_with_Angular: "Getting started with Angular",
      Beginning_our_Angular_todo_list_app:
        "Beginning our Angular todo list app",
      Styling_our_Angular_app: "Styling our Angular app",
      Creating_an_item_component: "Creating an item component",
      "Filtering_our_to-do_items": "Filtering our to-do items",
      Building_Angular_applications_and_further_resources:
        "Building Angular applications and further resources",
      "Server-side_website_programming":
        "Программирование серверной части сайта",
      First_steps: "Первые шаги",
      First_steps_overview: "Первые шаги",
      "Introduction_to_the_server-side":
        "Вступление в серверное программирование",
      "Client-Server_overview": "Клиент-сервер",
      "Server-side_web_frameworks": "Веб-фреймворки для серверной части",
      Website_security: "Защищённость веб-сайтов",
      "Django_web_framework_(Python)": "Веб-фреймворк Django (Python)",
      "Django_web_framework_(Python)_overview": "Веб-фреймворк Django (Python)",
      Django_introduction: "Вступление",
      Setting_up_a_development_environment: "Установка среды разработки",
      Tutorial_The_Local_Library_website:
        "Руководство: Сайт местной библиотеки",
      Tutorial_Part_2_Creating_a_skeleton_website:
        "Руководство часть 2: Создаём набросок сайта",
      Tutorial_Part_3_Using_models:
        "Руководство часть 3: Использование моделей",
      Tutorial_Part_4_Django_admin_site:
        "Руководство часть 4: Django панель администратора",
      Tutorial_Part_5_Creating_our_home_page:
        "Руководство часть 5: Создание нашей домашней страницы",
      Tutorial_Part_6_Generic_list_and_detail_views:
        "Руководство часть 6: Списки и представления",
      Tutorial_Part_7_Sessions_framework: "Руководство часть 7: Сессии",
      Tutorial_Part_8_User_authentication_and_permissions:
        "Руководство часть 8: Аутенфикация и разрешения пользователей",
      Tutorial_Part_9_Working_with_forms:
        "Руководство часть 9: Работа с формами",
      Tutorial_Part_10_Testing_a_Django_web_application:
        "Руководство часть 10: Тестирование веб-приложения на Django",
      Tutorial_Part_11_Deploying_Django_to_production:
        "Руководство часть 11: Разворачивание Django на продакшн сервере",
      Web_application_security: "Защищённость веб-приложения",
      Assessment_DIY_mini_blog: "Задание: создание мини блога",
      Further_resources: "Дальнейшее чтение",
      Common_questions: "Общие вопросы",
      HTML_questions: "Вопросы по HTML",
      CSS_questions: "Вопросы по CSS",
      Web_mechanics: "Как работает Веб",
      Tools_and_setup: "Инструменты и установка",
      Design_and_accessibility: "Дизайн и доступность",
    },
    "zh-CN": {
      Complete_beginners: "新手请从这开始！",
      Getting_started_with_the_web: "Web 入门",
      Getting_started_with_the_web_overview: "Web 概述",
      Installing_basic_software: "安装基本软件",
      What_will_your_website_look_like: "您的网站会是什么样？",
      Dealing_with_files: "处理文件",
      HTML_basics: "HTML 基础",
      CSS_basics: "CSS 基础",
      JavaScript_basics: "JavaScript 基础",
      Publishing_your_website: "发布您的网站",
      How_the_Web_works: "Web 如何运作",
      HTML_structuring_the_Web: "HTML — 构建 Web",
      Introduction_to_HTML: "HTML 介绍",
      Introduction_to_HTML_overview: "HTML 概述",
      Getting_started_with_HTML: "HTML 入门",
      Whats_in_the_head_metadata_in_HTML: "脑袋里是什么？HTML 中的元数据",
      HTML_text_fundamentals: "HTML 文字基础",
      Creating_hyperlinks: "建立超链接",
      Advanced_text_formatting: "高级文字格式",
      Document_and_website_structure: "文档与网站架构",
      Debugging_HTML: "HTML 除错",
      Assessment_marking_up_a_letter: "作业：标记字母",
      Assessment_structuring_a_page_of_content: "作业：构建出有内容的网页",
      Multimedia_and_embedding: "多媒体与嵌入",
      Multimedia_and_embedding_overview: "多媒体与嵌入概述",
      Images_in_HTML: "HTML 中的图片",
      Video_and_audio_content: "视频和音频内容",
      Other_embedding_technologies: "从对象到 iframe — 其他嵌入技术",
      Adding_vector_graphics_to_the_Web: "为 Web 新增向量图",
      Responsive_images: "自适应图片",
      Assessment_Mozilla_splash_page: "作业：Mozilla 醒目页面",
      HTML_tables: "HTML 表格",
      HTML_tables_overview: "HTML 表格概览",
      HTML_table_basics: "HTML 表格基础",
      HTML_table_advanced: "HTML 高级表格特性和可访问性",
      Assessment_Structuring_planet_data: "作业：构建行星数据",
      CSS_styling_the_Web: "CSS — 设计 Web",
      CSS_first_steps: "CSS 第一步",
      CSS_first_steps_overview: "CSS第一步概览",
      What_is_CSS: "什么是CSS",
      Getting_started_with_CSS: "让我们开始CSS之旅",
      How_CSS_is_structured: "如何让构建CSS",
      How_CSS_works: "CSS如何运行",
      Using_your_new_knowledge: "运用你的新知识",
      CSS_building_blocks: "CSS 构建基础",
      CSS_building_blocks_overview: "CSS构建基础概览",
      Cascade_and_inheritance: "层叠与继承",
      CSS_selectors: "CSS选择器",
      The_box_model: "盒模型",
      Backgrounds_and_borders: "背景与边框",
      Handling_different_text_directions: "处理不同方向的文本",
      Overflowing_content: "溢出的内容",
      Values_and_units: "值与单位",
      Sizing_items_in_CSS: "在CSS中调整大小",
      Images_media_and_form_elements: "图像、媒体和表单元素",
      Styling_tables: "样式化表格",
      Debugging_CSS: "调试CSS",
      Organizing_your_CSS: "组织你的CSS",
      Styling_text: "样式化文字",
      Styling_text_overview: "样式化文字概述",
      Fundamental_text_and_font_styling: "基础文字与字体样式化",
      Styling_lists: "样式化列表",
      Styling_links: "样式化链接",
      Web_fonts: "Web 字体",
      Assessment_typesetting_a_community_school_homepage:
        "作业：排版社区大学首页",
      CSS_layout: "CSS 排版",
      CSS_layout_overview: "CSS 排版概述",
      Normal_Flow: "正常布局流",
      Flexbox: "弹性区块",
      Grids: "网格",
      Floats: "浮动",
      Positioning: "定位",
      "Multiple-column_Layout": "多列布局",
      Responsive_design: "响应式布局",
      Media_queries: "媒体查询",
      Legacy_Layout_Methods: "传统的布局方法",
      Supporting_Older_Browsers: "支持旧的浏览器",
      Fundamental_Layout_Comprehension: "基础布局练习",
      "JavaScript_dynamic_client-side_scripting": "JavaScript — 用户端动态脚本",
      JavaScript_first_steps: "JavaScript 第一步",
      JavaScript_first_steps_overview: "JavaScript 第一步概述",
      What_is_JavaScript: "什么是 JavaScript？",
      A_first_splash_into_JavaScript: "初次接触 JavaScript",
      What_went_wrong: "出现了什么问题？JavaScript 疑难解答",
      Storing_the_information_you_need: "储存你所需的信息 — 变量",
      Basic_math_in_JavaScript: "JavaScript 基础概念 — 数字与运算符",
      Handling_text: "处理文字 — JavaScript 中的字符串",
      Useful_string_methods: "有用的字符串方法",
      Arrays: "数组",
      Assessment_silly_story_generator: "作业：傻瓜故事产生器",
      JavaScript_building_blocks: "JavaScript 基础要件",
      JavaScript_building_blocks_overview: "JavaScript 基础要件概述",
      Making_decisions_in_your_code: "在代码中决策 — 条件",
      Looping_code: "代码循环",
      Functions: "函数 - 可重复利用的代码块",
      Build_your_own_function: "建立自己的函数",
      Function_return_values: "函数回传值",
      Introduction_to_events: "事件介绍",
      Assessment_image_gallery: "作业：图库",
      Introducing_JavaScript_objects: "JavaScript 对象介绍",
      Introducing_JavaScript_objects_overview: "JavaScript 对象概述",
      Object_basics: "对象基础概念",
      "Object-oriented_JavaScript_for_beginners":
        "适合新手的面向对象 JavaScript",
      Object_prototypes: "对象原型",
      Inheritance_in_JavaScript: "JavaScript 中的继承",
      Working_with_JSON_data: "使用 JSON 资料",
      Object_building_practice: "对象构建实践",
      Assessment_Adding_features_to_our_bouncing_balls_demo:
        "作业：为弹跳球展示新增功能",
      Asynchronous_JavaScript: "异步JavaScript",
      Asynchronous_JavaScript_overview: "异步JavaScript概览",
      General_asynchronous_programming_concepts: "通用异步编程概念",
      Introducing_asynchronous_JavaScript: "异步JavaScript简介",
      Timeouts_intervals: "合作异步JavaScript: 超时和间隔",
      Promises: "Promises: 优雅的异步处理",
      Async_await: "async和await:让异步编程更简单",
      Choosing_the_right_approach: "选择正确的方法",
      "Client-side_web_APIs": "客户端网页 API",
      "Client-side_web_APIs_Introduction": "网页 API 介绍",
      "Client-side_web_APIs_Manipulating_documents": "操纵文档",
      "Client-side_web_APIs_Fetching_data": "从服务器获取数据",
      "Client-side_web_APIs_Third_party_APIs": "第三方 API",
      "Client-side_web_APIs_Drawing_graphics": "画图",
      "Client-side_web_APIs_Video_and_audio_APIs": "视频与音频 API",
      "Client-side_web_APIs_client-side_storage": "客户端存储",
      Web_forms: "Web表单 — 与用户数据打交道",
      Web_forms_core: "Web表单核心",
      Web_forms_overview: "Web表单概览",
      Your_first_form: "你的第一个表单",
      How_to_structure_a_web_form: "如何构造Web表单",
      Basic_native_form_controls: "原生表单控件",
      The_HTML5_input_types: "HTML5的input类型",
      Other_form_controls: "其它表单控件",
      Styling_web_forms: "样式化Web表单",
      Advanced_form_styling: "高级表单样式",
      "UI_pseudo-classes": "UI 伪类",
      "Client-side_form_validation": "客户端表单验证",
      Sending_form_data: "发送表单数据",
      Web_forms_advanced: "Web表单进阶",
      How_to_build_custom_form_controls: "如何构造自定义表单控件",
      Sending_forms_through_JavaScript: "使用JavaScript发送表单",
      CSS_property_compatibility_table_for_form_controls: "表单组件兼容性列表",
      "Accessibility_—_Make_the_web_usable_by_everyone":
        "可访问性 — 使每个人都能使用 Web",
      Accessibility_guides: "可访问性指南",
      Accessibility_assessment: "可访问性测评",
      Accessibility_overview: "可访问性概览",
      What_is_accessibility: "什么是可访问性",
      HTML_a_good_basis_for_accessibility: "HTML: 可访问性的好基础",
      CSS_and_JavaScript_accessibility_best_practices:
        "CSS 和 JavaScript 可访问性最佳实践",
      "WAI-ARIA_basics": "WAI-ARIA 基础",
      Accessible_multimedia: "可访问性多媒体",
      Mobile_accessibility: "移动端可访问性",
      Assessment_Accessibility_troubleshooting: "作业：可访问性疑难解答",
      Tools_and_testing: "工具与测试",
      Cross_browser_testing: "跨浏览器测试",
      Cross_browser_testing_overview: "跨浏览器测试概述",
      Introduction_to_cross_browser_testing: "跨浏览器测试介绍",
      Strategies_for_carrying_out_testing: "执行测试策略",
      Handling_common_HTML_and_CSS_problems: "处理常见的 HTML 与 CSS 问题",
      Handling_common_JavaScript_problems: "处理常见的 JavaScript 问题",
      Handling_common_accessibility_problems: "处理常见的可访问性问题",
      Implementing_feature_detection: "建置功能侦测",
      Introduction_to_automated_testing: "自动测试介绍",
      Setting_up_your_own_test_automation_environment: "设置您的自动测试环境",
      Git_and_GitHub: "Git 和 GitHub",
      Git_and_GitHub_overview: "Git和GitHub 概览",
      "Client-side_web_development_tools": "客户端web开发工具",
      "Client-side_web_development_tools_index": "客户端web开发工具索引",
      "Client-side_tooling_overview": "客户端工具概览",
      Command_line_crash_course: "命令行速成课",
      Package_management_basics: "包管理基础",
      Introducing_a_complete_toolchain: "一个完整的工具链",
      Deploying_our_app: "发布你的应用",
      "Introduction_to_client-side_frameworks": "客户端框架介绍",
      "Client-side_frameworks_overview": "客户端框架概览",
      Framework_main_features: "框架的主要特性",
      React: "React",
      Getting_started_with_React: "Getting started with React",
      Beginning_our_React_todo_list: "Beginning our React todo list",
      Componentizing_our_React_app: "Componentizing our React app",
      "React_interactivity:_Events_and_state":
        "React interactivity: Events and state",
      "React_interactivity:_Editing_filtering_conditional_rendering":
        "React interactivity: Editing, filtering, conditional rendering",
      Accessibility_in_React: "Accessibility in React",
      React_resources: "React resources",
      Ember: "Ember",
      Getting_started_with_Ember: "Getting started with Ember",
      Ember_app_structure_and_componentization:
        "Ember app structure and componentization",
      "Ember_interactivity:_Events_classes_and_state":
        "Ember interactivity: Events, classes and state",
      "Ember_Interactivity:_Footer_functionality_conditional_rendering":
        "Ember Interactivity: Footer functionality, conditional rendering",
      Routing_in_Ember: "Routing in Ember",
      Ember_resources_and_troubleshooting:
        "Ember resources and troubleshooting",
      Vue: "Vue",
      Getting_started_with_Vue: "开始使用Vue",
      Creating_our_first_Vue_component: "创建第一个Vue组件",
      Rendering_a_list_of_Vue_components: "渲染一个Vue组件列表",
      "Adding_a_new_todo_form:_Vue_events_methods_and_models":
        "添加一个新的TODO表单: Vue事件、方法、模型",
      Styling_Vue_components_with_CSS: "用CSS样式化Vue组件",
      Using_Vue_computed_properties: "Using Vue computed properties",
      "Vue_conditional_rendering:_editing_existing_todos":
        "Vue conditional rendering: editing existing todos",
      Focus_management_with_Vue_refs: "Focus management with Vue refs",
      Vue_resources: "Vue resources",
      Svelte: "Svelte",
      Getting_started_with_Svelte: "Getting started with Svelte",
      Starting_our_Svelte_Todo_list_app: "Starting our Svelte Todo list app",
      "Dynamic_behavior_in_Svelte:_working_with_variables_and_props":
        "Dynamic behavior in Svelte: working with variables and props",
      Componentizing_our_Svelte_app: "Componentizing our Svelte app",
      "Advanced_Svelte:_Reactivity_lifecycle_accessibility":
        "Advanced Svelte: Reactivity, lifecycle, accessibility",
      Working_with_Svelte_stores: "Working with Svelte stores",
      TypeScript_support_in_Svelte: "TypeScript support in Svelte",
      Deployment_and_next_steps: "Deployment and next steps",
      Angular: "Angular",
      Getting_started_with_Angular: "Getting started with Angular",
      Beginning_our_Angular_todo_list_app:
        "Beginning our Angular todo list app",
      Styling_our_Angular_app: "Styling our Angular app",
      Creating_an_item_component: "Creating an item component",
      "Filtering_our_to-do_items": "Filtering our to-do items",
      Building_Angular_applications_and_further_resources:
        "Building Angular applications and further resources",
      "Server-side_website_programming": "服务端网页编程",
      First_steps: "第一步",
      First_steps_overview: "第一步概述",
      "Introduction_to_the_server-side": "服务端介绍",
      "Client-Server_overview": "用户端概述",
      "Server-side_web_frameworks": "服务端网络框架",
      Website_security: "网站安全",
      "Django_web_framework_(Python)": "Django 网站框架 (Python)",
      "Django_web_framework_(Python)_overview": "Django 网站框架 (Python) 概述",
      Django_introduction: "介绍",
      Setting_up_a_development_environment: "搭建开发环境",
      Tutorial_The_Local_Library_website: "在线教学：本地图书馆网站",
      Tutorial_Part_2_Creating_a_skeleton_website: "在线教学 2：建立网站框架",
      Tutorial_Part_3_Using_models: "在线教学 3：使用模型",
      Tutorial_Part_4_Django_admin_site: "在线教学 4：Django 管理网站",
      Tutorial_Part_5_Creating_our_home_page: "在线教学 5：建立我们的首页",
      Tutorial_Part_6_Generic_list_and_detail_views:
        "在线教学 6：通用列表与细节检查",
      Tutorial_Part_7_Sessions_framework: "在线教学 7：会话框架",
      Tutorial_Part_8_User_authentication_and_permissions:
        "在线教学 8：用户授权与许可",
      Tutorial_Part_9_Working_with_forms: "在线教学 9：搭配表单",
      Tutorial_Part_10_Testing_a_Django_web_application:
        "在线教学 10：测试 Django 的 Web 应用",
      Tutorial_Part_11_Deploying_Django_to_production:
        "在线教学 11：部署 Django 至产品",
      Web_application_security: "Web 应用安全性",
      Assessment_DIY_mini_blog: "作业：DIY 博客",
      "Express_Web_Framework_(Node.js_JavaScript)":
        "Express 网页框架 (node.js/JavaScript)",
      "Express_Web_Framework_(Node.js_JavaScript)_overview":
        "Express 网页框架 (Node.js/JavaScript) 概览",
      Express_Node_introduction: "Express/Node 介绍",
      "Setting_up_a_Node_(Express)_development_environment":
        "架设 Node (Express) 开发环境",
      Express_Tutorial_The_Local_Library_website:
        "Express 教程： 本地图书馆网站",
      Express_Tutorial_Part_2_Creating_a_skeleton_website:
        "Express 教程 2： 新建网站骨架",
      "Express_Tutorial_Part_3_Using_a_database_(with_Mongoose)":
        "Express 教程 3： 使用数据库 (Mongoose)",
      Express_Tutorial_Part_4_Routes_and_controllers:
        "Express 教程 4： 路由和控制器",
      Express_Tutorial_Part_5_Displaying_library_data:
        "Express 教程 5： 呈现图书馆数据",
      Express_Tutorial_Part_6_Working_with_forms: "Express 教程 6： 使用表单",
      Express_Tutorial_Part_7_Deploying_to_production:
        "Express 教程 7： 部署至生产环境",
      Further_resources: "更多资源",
      Common_questions: "常见问题",
      HTML_questions: "HTML 问题",
      CSS_questions: "CSS 问题",
      Web_mechanics: "Web 是如何运作的",
      Tools_and_setup: "工具与安装",
      Design_and_accessibility: "设计与可访问性",
    },
    "zh-TW": {
      Complete_beginners: "全新手請從這開始！",
      Getting_started_with_the_web: "Web 入門",
      Getting_started_with_the_web_overview: "Web 概述",
      Installing_basic_software: "安裝基本軟體",
      What_will_your_website_look_like: "自己的網站會是什麼樣子？",
      Dealing_with_files: "處理檔案",
      HTML_basics: "HTML 基礎概念",
      CSS_basics: "CSS 基礎概念",
      JavaScript_basics: "JavaScript 基礎概念",
      Publishing_your_website: "發佈自己的網站",
      How_the_Web_works: "Web 運作的方式",
      HTML_structuring_the_Web: "HTML — 架構 Web",
      Introduction_to_HTML: "HTML 介紹",
      Introduction_to_HTML_overview: "HTML 概述",
      Getting_started_with_HTML: "HTML 入門",
      Whats_in_the_head_metadata_in_HTML:
        "標題裡是什麼？HTML 中的後設資料 (Metadata)",
      HTML_text_fundamentals: "HTML 文字基礎概念",
      Creating_hyperlinks: "建立超連結",
      Advanced_text_formatting: "進階文字格式",
      Document_and_website_structure: "文件與網站架構",
      Debugging_HTML: "HTML 除錯",
      Assessment_marking_up_a_letter: "親和度：設個字母",
      Assessment_structuring_a_page_of_content: "親和度：架構出具備內容的網頁",
      Multimedia_and_embedding: "多媒體與嵌入",
      Multimedia_and_embedding_overview: "多媒體與嵌入的概述",
      Images_in_HTML: "HTML 中的圖片",
      Video_and_audio_content: "視訊與音訊內容",
      Other_embedding_technologies: "從物件到 iframe — 其他嵌入技巧",
      Adding_vector_graphics_to_the_Web: "為 Web 新增向量圖",
      Responsive_images: "適應性圖片",
      Assessment_Mozilla_splash_page: "親和度：Mozilla 形象頁面",
      HTML_tables: "HTML 表格",
      HTML_tables_overview: "HTML 表格概述",
      HTML_table_basics: "HTML表格基礎",
      HTML_table_advanced: "HTML Table advanced features and accessibility",
      Assessment_Structuring_planet_data: "Assessment: Structuring planet data",
      CSS_styling_the_Web: "CSS — 設計 Web 的風格",
      CSS_first_steps: "初探 CSS",
      CSS_first_steps_overview: "初探 CSS（概述）",
      What_is_CSS: "CSS 是什麼？",
      Getting_started_with_CSS: "CSS 入門",
      How_CSS_is_structured: "How CSS is structured",
      How_CSS_works: "CSS 怎麼運作",
      Using_your_new_knowledge: "Using your new knowledge",
      CSS_building_blocks: "CSS 組件",
      CSS_building_blocks_overview: "CSS building blocks overview",
      Cascade_and_inheritance: "Cascade and inheritance",
      CSS_selectors: "CSS selectors",
      The_box_model: "The box model",
      Backgrounds_and_borders: "Backgrounds and borders",
      Handling_different_text_directions: "Handling different text directions",
      Overflowing_content: "Overflowing content",
      Values_and_units: "Values and units",
      Sizing_items_in_CSS: "Sizing items in CSS",
      Images_media_and_form_elements: "Images, media, and form elements",
      Styling_tables: "Styling tables",
      Debugging_CSS: "Debugging CSS",
      Organizing_your_CSS: "Organizing your CSS",
      Styling_text: "樣式化文字",
      Styling_text_overview: "樣式化文字概述",
      Fundamental_text_and_font_styling: "基礎的文字與字型樣式化",
      Styling_lists: "樣式化列表",
      Styling_links: "樣式化連結",
      Web_fonts: "Web 字型",
      Assessment_typesetting_a_community_school_homepage:
        "親合度：設定社區大學首頁的版面",
      CSS_layout: "CSS 版面配置",
      CSS_layout_overview: "CSS 版面配置概述",
      Normal_Flow: "Normal Flow",
      Flexbox: "彈性區塊",
      Grids: "格線",
      Floats: "浮動",
      Positioning: "定位",
      "Multiple-column_Layout": "Multiple-column Layout",
      Responsive_design: "Responsive design",
      Media_queries: "Beginner's guide to media queries",
      Legacy_Layout_Methods: "Legacy Layout Methods",
      Supporting_Older_Browsers: "Supporting Older Browsers",
      Fundamental_Layout_Comprehension: "Fundamental Layout Comprehension",
      "JavaScript_dynamic_client-side_scripting":
        "JavaScript — 動態的用戶端指令",
      JavaScript_first_steps: "JavaScript 第一步",
      JavaScript_first_steps_overview: "JavaScript 第一步概述",
      What_is_JavaScript: "什麼是 JavaScript？",
      A_first_splash_into_JavaScript: "初次接觸 JavaScript",
      What_went_wrong: "出了什麼問題？JavaScript 疑難排解",
      Storing_the_information_you_need: "儲存你所需的資訊 — 變數",
      Basic_math_in_JavaScript: "JavaScript 基礎概念 — 數字與運算子",
      Handling_text: "處理文字 — JavaScript 中的字串",
      Useful_string_methods: "有用的字串函式",
      Arrays: "陣列",
      Assessment_silly_story_generator: "親合度：傻瓜故事產生器",
      JavaScript_building_blocks: "JavaScript 基礎要件",
      JavaScript_building_blocks_overview: "JavaScript 基礎要件概述",
      Making_decisions_in_your_code: "於程式碼中決策 — 條件",
      Looping_code: "程式碼迴圈",
      Functions: "函式 — 可重複使用的程式碼區塊",
      Build_your_own_function: "建立自己的函式",
      Function_return_values: "函式回傳值",
      Introduction_to_events: "事件介紹",
      Assessment_image_gallery: "親合度：圖庫",
      Introducing_JavaScript_objects: "JavaScript 物件介紹",
      Introducing_JavaScript_objects_overview: "JavaScript 物件概述",
      Object_basics: "物件基礎概念",
      "Object-oriented_JavaScript_for_beginners":
        "適合新手的物件導向 (OO) JavaScript",
      Object_prototypes: "物件原型",
      Inheritance_in_JavaScript: "JavaScript 中的繼承",
      Working_with_JSON_data: "使用 JSON 資料",
      Object_building_practice: "物件建構實作",
      Assessment_Adding_features_to_our_bouncing_balls_demo:
        "親合度：為彈跳球展示新增功能",
      Asynchronous_JavaScript: "非同步的 JavaScript",
      Asynchronous_JavaScript_overview: "Asynchronous JavaScript overview",
      General_asynchronous_programming_concepts:
        "General asynchronous programming concepts",
      Introducing_asynchronous_JavaScript:
        "Introducing asynchronous JavaScript",
      Timeouts_intervals:
        "Cooperative asynchronous Java​Script: Timeouts and intervals",
      Promises: "Graceful asynchronous programming with Promises",
      Async_await:
        "Making asynchronous programming easier with async and await",
      Choosing_the_right_approach: "Choosing the right approach",
      "Client-side_web_APIs": "客戶端 web APIs",
      "Client-side_web_APIs_Introduction": "Introduction to web APIs",
      "Client-side_web_APIs_Manipulating_documents": "文件操作",
      "Client-side_web_APIs_Fetching_data": "Fetching data from the server",
      "Client-side_web_APIs_Third_party_APIs": "Third party APIs",
      "Client-side_web_APIs_Drawing_graphics": "Drawing graphics",
      "Client-side_web_APIs_Video_and_audio_APIs": "Video and audio APIs",
      "Client-side_web_APIs_client-side_storage": "Client-side storage",
      Web_forms: "網頁表單-與使用者資料合作",
      Web_forms_core: "核心的表單學習途徑",
      Web_forms_overview: "網頁表單概述",
      Your_first_form: "Your first form",
      How_to_structure_a_web_form: "如何建構網頁表單",
      Basic_native_form_controls: "Basic native form controls",
      The_HTML5_input_types: "The HTML5 input types",
      Other_form_controls: "Other form controls",
      Styling_web_forms: "Styling web forms",
      Advanced_form_styling: "Advanced form styling",
      "UI_pseudo-classes": "UI pseudo-classes",
      "Client-side_form_validation": "Client-side form validation",
      Sending_form_data: "Sending form data",
      Web_forms_advanced: "深入網頁表單",
      How_to_build_custom_form_controls: "How to build custom form controls",
      Sending_forms_through_JavaScript: "Sending forms through JavaScript",
      CSS_property_compatibility_table_for_form_controls:
        "CSS property compatibility table for form controls",
      "Accessibility_—_Make_the_web_usable_by_everyone":
        "無障礙網頁 — 每個人都可以使用的網頁",
      Accessibility_guides: "無障礙網頁指南",
      Accessibility_assessment: "無障礙網頁評估",
      Accessibility_overview: "無障礙網頁概述",
      What_is_accessibility: "何謂無障礙網頁？",
      HTML_a_good_basis_for_accessibility:
        "HTML: A good basis for accessibility",
      CSS_and_JavaScript_accessibility_best_practices:
        "CSS and JavaScript accessibility best practices",
      "WAI-ARIA_basics": "WAI-ARIA 基礎",
      Accessible_multimedia: "Accessible multimedia",
      Mobile_accessibility: "行動裝置上的無障礙",
      Assessment_Accessibility_troubleshooting:
        "Assessment: Accessibility troubleshooting",
      Tools_and_testing: "工具與測試",
      Cross_browser_testing: "跨瀏覽器測試",
      Cross_browser_testing_overview: "跨瀏覽器測試概述",
      Introduction_to_cross_browser_testing: "跨瀏覽器測試介紹",
      Strategies_for_carrying_out_testing: "測試執行策略",
      Handling_common_HTML_and_CSS_problems: "處理常見的 HTML 與 CSS 問題",
      Handling_common_JavaScript_problems: "處理常見的 JavaScript 問題",
      Handling_common_accessibility_problems: "處理常見的親合度問題",
      Implementing_feature_detection: "建置功能偵測",
      Introduction_to_automated_testing: "自動化測試介紹",
      Setting_up_your_own_test_automation_environment:
        "設定自己的自動化測試環境",
      Git_and_GitHub: "Git and GitHub",
      Git_and_GitHub_overview: "Git and GitHub 概述",
      "Client-side_web_development_tools": "Client-side web development tools",
      "Client-side_web_development_tools_index":
        "Client-side web development tools index",
      "Client-side_tooling_overview": "Client-side tooling overview",
      Command_line_crash_course: "Command line crash course",
      Package_management_basics: "Package management basics",
      Introducing_a_complete_toolchain: "Introducing a complete toolchain",
      Deploying_our_app: "Deploying our app",
      "Introduction_to_client-side_frameworks": "介紹前端框架",
      "Client-side_frameworks_overview": "前端框架簡介",
      Framework_main_features: "Framework main features",
      React: "React",
      Getting_started_with_React: "Getting started with React",
      Beginning_our_React_todo_list: "Beginning our React todo list",
      Componentizing_our_React_app: "Componentizing our React app",
      "React_interactivity:_Events_and_state":
        "React interactivity: Events and state",
      "React_interactivity:_Editing_filtering_conditional_rendering":
        "React interactivity: Editing, filtering, conditional rendering",
      Accessibility_in_React: "Accessibility in React",
      React_resources: "React resources",
      Ember: "Ember",
      Getting_started_with_Ember: "Getting started with Ember",
      Ember_app_structure_and_componentization:
        "Ember app structure and componentization",
      "Ember_interactivity:_Events_classes_and_state":
        "Ember interactivity: Events, classes and state",
      "Ember_Interactivity:_Footer_functionality_conditional_rendering":
        "Ember Interactivity: Footer functionality, conditional rendering",
      Routing_in_Ember: "Routing in Ember",
      Ember_resources_and_troubleshooting:
        "Ember resources and troubleshooting",
      Vue: "Vue",
      Getting_started_with_Vue: "開始學 Vue",
      Creating_our_first_Vue_component: "Creating our first Vue component",
      Rendering_a_list_of_Vue_components: "Rendering a list of Vue components",
      "Adding_a_new_todo_form:_Vue_events_methods_and_models":
        "Adding a new todo form: Vue events, methods, and models",
      Styling_Vue_components_with_CSS: "Styling Vue components with CSS",
      Using_Vue_computed_properties: "Using Vue computed properties",
      "Vue_conditional_rendering:_editing_existing_todos":
        "Vue conditional rendering: editing existing todos",
      Focus_management_with_Vue_refs: "Focus management with Vue refs",
      Vue_resources: "Vue resources",
      Svelte: "Svelte",
      Getting_started_with_Svelte: "Svelte 入門",
      Starting_our_Svelte_Todo_list_app: "Starting our Svelte Todo list app",
      "Dynamic_behavior_in_Svelte:_working_with_variables_and_props":
        "Dynamic behavior in Svelte: working with variables and props",
      Componentizing_our_Svelte_app: "Componentizing our Svelte app",
      "Advanced_Svelte:_Reactivity_lifecycle_accessibility":
        "Advanced Svelte: Reactivity, lifecycle, accessibility",
      Working_with_Svelte_stores: "Working with Svelte stores",
      TypeScript_support_in_Svelte: "TypeScript support in Svelte",
      Deployment_and_next_steps: "Deployment and next steps",
      Angular: "Angular",
      Getting_started_with_Angular: "Angular 新手入門",
      Beginning_our_Angular_todo_list_app:
        "開始開發我們的 Angular 待辦事項應用程式",
      Styling_our_Angular_app: "使用樣式點綴我們的 Angular 應用程式",
      Creating_an_item_component: "建立一個 item 元件",
      "Filtering_our_to-do_items": "篩選我們的待辦事項項目",
      Building_Angular_applications_and_further_resources:
        "建構 Angular 應用程式與更多資源",
      "Server-side_website_programming": "伺服端網站程式設計",
      First_steps: "第一步",
      First_steps_overview: "第一步概述",
      "Introduction_to_the_server-side": "伺服端介紹",
      "Client-Server_overview": "用戶端概述",
      "Server-side_web_frameworks": "伺服端網路框架",
      Website_security: "網站安全",
      "Django_web_framework_(Python)": "Django 網站框架 (Python)",
      "Django_web_framework_(Python)_overview": "Django 網站框架 (Python) 概述",
      Django_introduction: "介紹",
      Setting_up_a_development_environment: "設定開發環境",
      Tutorial_The_Local_Library_website: "線上教學：本地圖書館網站",
      Tutorial_Part_2_Creating_a_skeleton_website: "線上教學 2：建立網站骨架",
      Tutorial_Part_3_Using_models: "線上教學 3：使用模型",
      Tutorial_Part_4_Django_admin_site: "線上教學 4：Django 管理網站",
      Tutorial_Part_5_Creating_our_home_page: "線上教學 5：建立我們的首頁",
      Tutorial_Part_6_Generic_list_and_detail_views:
        "線上教學 6：泛型清單與細節檢視",
      Tutorial_Part_7_Sessions_framework: "線上教學 7：會話 (Sessions) 框架",
      Tutorial_Part_8_User_authentication_and_permissions:
        "線上教學 8：使用者授權與許可",
      Tutorial_Part_9_Working_with_forms: "線上教學 9：搭配表單",
      Tutorial_Part_10_Testing_a_Django_web_application:
        "線上教學 10：測試 Django 的 Web App",
      Tutorial_Part_11_Deploying_Django_to_production:
        "線上教學 11：佈署 Django 至產品",
      Web_application_security: "Web App 安全性",
      Assessment_DIY_mini_blog: "親合度：DIY 迷你部落格",
      "Express_Web_Framework_(Node.js_JavaScript)":
        "Express 網站框架 (node.js/JavaScript)",
      "Express_Web_Framework_(Node.js_JavaScript)_overview":
        "Express 網站框架 (Node.js/JavaScript) 概述",
      Express_Node_introduction: "Express/Node 介紹",
      "Setting_up_a_Node_(Express)_development_environment":
        "設定 Node (Express) 的開發環境",
      Express_Tutorial_The_Local_Library_website:
        "Express 教學 1: 本地圖書館網站",
      Express_Tutorial_Part_2_Creating_a_skeleton_website:
        "Express 教學 2: 建立骨架網站",
      "Express_Tutorial_Part_3_Using_a_database_(with_Mongoose)":
        "Express 教學 3: 使用資料庫 (Mongoose)",
      Express_Tutorial_Part_4_Routes_and_controllers:
        "Express 教學 4: 路由與控制器",
      Express_Tutorial_Part_5_Displaying_library_data:
        "Express 教程 5: 呈現圖書館的資料",
      Express_Tutorial_Part_6_Working_with_forms: "Express 教學 6: 使用表單",
      Express_Tutorial_Part_7_Deploying_to_production:
        "Express 教學 7: 佈署到正式環境",
      Further_resources: "更多資源",
      Common_questions: "常見問題",
      HTML_questions: "HTML 問題",
      CSS_questions: "CSS 問題",
      Web_mechanics: "Web 的運作方式",
      Tools_and_setup: "工具與設定",
      Design_and_accessibility: "設計與親合度",
    },
    fr: {
      Complete_beginners: "Bienvenue aux débutants !",
      Getting_started_with_the_web: "Commencer avec le Web",
      Getting_started_with_the_web_overview:
        "Vue d'ensemble de Commencer avec le Web",
      Installing_basic_software: "Installation des outils de base",
      What_will_your_website_look_like:
        "Quel sera l'aspect de votre site web ?",
      Dealing_with_files: "Gérer les fichiers",
      HTML_basics: "Les bases de HTML",
      CSS_basics: "Les bases de CSS",
      JavaScript_basics: "Les bases de JavaScript",
      Publishing_your_website: "Publier votre site web",
      How_the_Web_works: "Le fonctionnement du Web",
      HTML_structuring_the_Web: "HTML",
      Introduction_to_HTML: "Introduction au HTML",
      Introduction_to_HTML_overview: "Vue d'ensemble de Introduction au HTML",
      Getting_started_with_HTML: "Commencer avec le HTML",
      Whats_in_the_head_metadata_in_HTML:
        "Qu'y-a-t-il dans l'en-tête ? Métadonnées en HTML",
      HTML_text_fundamentals: "Fondamentaux du texte en HTML",
      Creating_hyperlinks: "Création d'hyperliens",
      Advanced_text_formatting: "Formatage avancé du texte",
      Document_and_website_structure: "Structure de site web et de document",
      Debugging_HTML: "Déboguer en HTML",
      Assessment_marking_up_a_letter: "Baliser une lettre",
      Assessment_structuring_a_page_of_content:
        "Structurer une page de contenu",
    },
    ja: {
      Complete_beginners: "完全な初心者はこちらから!",
      Getting_started_with_the_web: "ウェブ入門",
      Getting_started_with_the_web_overview: "ウェブ入門",
      Installing_basic_software: "基本的なソフトウェアのインストール",
      What_will_your_website_look_like: "ウェブサイトをどんな外見にするか",
      Dealing_with_files: "ファイルの扱い",
      HTML_basics: "HTML の基本",
      CSS_basics: "CSS の基本",
      JavaScript_basics: "JavaScript の基本",
      Publishing_your_website: "ウェブサイトの公開",
      How_the_Web_works: "ウェブのしくみ",
      HTML_structuring_the_Web: "HTML — Structuring the Web",
      Introduction_to_HTML: "HTML概論",
      Introduction_to_HTML_overview: "HTML概論",
      Getting_started_with_HTML: "Getting started with HTML",
      Whats_in_the_head_metadata_in_HTML: "head って何？HTML のメタデータ",
      HTML_text_fundamentals: "HTML テキストの基礎",
      Creating_hyperlinks: "ハイパーリンクを作ってみる",
      Advanced_text_formatting: "Advanced text formatting",
      Document_and_website_structure: "Document and website structure",
      Debugging_HTML: "Debugging HTML",
      Assessment_marking_up_a_letter: "Assessment: Marking up a letter",
      Assessment_structuring_a_page_of_content:
        "Assessment: Structuring a page of content",
      Multimedia_and_embedding: "Multimedia and embedding",
      Multimedia_and_embedding_overview: "Multimedia and embedding overview",
      Images_in_HTML: "Images in HTML",
      Video_and_audio_content: "Video and audio content",
      Other_embedding_technologies:
        "From object to iframe — other embedding technologies",
      Adding_vector_graphics_to_the_Web: "Adding vector graphics to the Web",
      Responsive_images: "Responsive images",
      Assessment_Mozilla_splash_page: "Assessment: Mozilla splash page",
      HTML_tables: "HTML tables",
      HTML_tables_overview: "HTML tables overview",
      HTML_table_basics: "HTML table basics",
      HTML_table_advanced: "HTML Table advanced features and accessibility",
      Assessment_Structuring_planet_data: "Assessment: Structuring planet data",
      CSS_styling_the_Web: "CSS — Styling the Web",
      CSS_first_steps: "CSS first steps",
      CSS_first_steps_overview: "CSS first steps overview",
      What_is_CSS: "What is CSS?",
      Getting_started_with_CSS: "Getting started with CSS",
      How_CSS_is_structured: "How CSS is structured",
      How_CSS_works: "How CSS works",
      Using_your_new_knowledge: "Using your new knowledge",
      CSS_building_blocks: "CSS building blocks",
      CSS_building_blocks_overview: "CSS building blocks overview",
      Cascade_and_inheritance: "Cascade and inheritance",
      CSS_selectors: "CSS selectors",
      The_box_model: "The box model",
      Backgrounds_and_borders: "Backgrounds and borders",
      Handling_different_text_directions: "Handling different text directions",
      Overflowing_content: "Overflowing content",
      Values_and_units: "Values and units",
      Sizing_items_in_CSS: "Sizing items in CSS",
      Images_media_and_form_elements: "Images, media, and form elements",
      Styling_tables: "Styling tables",
      Debugging_CSS: "Debugging CSS",
      Organizing_your_CSS: "Organizing your CSS",
      Styling_text: "Styling text",
      Styling_text_overview: "Styling text overview",
      Fundamental_text_and_font_styling: "Fundamental text and font styling",
      Styling_lists: "Styling lists",
      Styling_links: "Styling links",
      Web_fonts: "Web fonts",
      Assessment_typesetting_a_community_school_homepage:
        "Assessment: Typesetting a community school homepage",
      CSS_layout: "CSS layout",
      CSS_layout_overview: "CSS layout overview",
      Layout_introduction: "Introduction to CSS layout",
      Normal_Flow: "Normal Flow",
      Flexbox: "Flexbox",
      Grids: "Grids",
      Floats: "Floats",
      Positioning: "Positioning",
      "Multiple-column_Layout": "Multiple-column Layout",
      Responsive_design: "Responsive design",
      Media_queries: "Beginner's guide to media queries",
      Legacy_Layout_Methods: "Legacy Layout Methods",
      Supporting_Older_Browsers: "Supporting Older Browsers",
      Fundamental_Layout_Comprehension: "Fundamental Layout Comprehension",
      "JavaScript_dynamic_client-side_scripting":
        "JavaScript — 動的クライアントサイドスクリプト",
      JavaScript_first_steps: "JavaScript の第一歩",
      JavaScript_first_steps_overview: "JavaScript の第一歩",
      What_is_JavaScript: "JavaScriptって何？",
      A_first_splash_into_JavaScript: "JavaScriptへの最初のダイブ",
      What_went_wrong: "何が間違っている? JavaScript のトラブルシューティング",
      Storing_the_information_you_need: "必要な情報を保存する — 変数",
      Basic_math_in_JavaScript: "JavaScriptでの数学入門 — 数値と演算子について",
      Handling_text: "テキストを扱う — JavaScript での文字列",
      Useful_string_methods: "便利な文字列メソッド",
      Arrays: "配列",
      Assessment_silly_story_generator: "バカ話ジェネレーター",
      JavaScript_building_blocks: "JavaScript building blocks",
      JavaScript_building_blocks_overview:
        "JavaScript building blocks overview",
      Making_decisions_in_your_code:
        "Making decisions in your code — Conditionals",
      Looping_code: "Looping code",
      Functions: "Functions — Reusable blocks of code",
      Build_your_own_function: "Build your own function",
      Function_return_values: "Function return values",
      Introduction_to_events: "Introduction to events",
      Assessment_image_gallery: "Assessment: Image gallery",
      Introducing_JavaScript_objects: "Introducing JavaScript objects",
      Introducing_JavaScript_objects_overview:
        "Introducing JavaScript objects overview",
      Object_basics: "Object basics",
      "Object-oriented_JavaScript_for_beginners":
        "Object-oriented JavaScript for beginners",
      Object_prototypes: "Object prototypes",
      Inheritance_in_JavaScript: "Inheritance in JavaScript",
      Working_with_JSON_data: "Working with JSON data",
      Object_building_practice: "Object building practice",
      Assessment_Adding_features_to_our_bouncing_balls_demo:
        "Assessment: Adding features to our bouncing balls demo",
      Asynchronous_JavaScript: "Asynchronous JavaScript",
      Asynchronous_JavaScript_overview: "Asynchronous JavaScript overview",
      General_asynchronous_programming_concepts:
        "General asynchronous programming concepts",
      Introducing_asynchronous_JavaScript:
        "Introducing asynchronous JavaScript",
      Timeouts_intervals:
        "Cooperative asynchronous Java​Script: Timeouts and intervals",
      Promises: "Graceful asynchronous programming with Promises",
      Async_await:
        "Making asynchronous programming easier with async and await",
      Choosing_the_right_approach: "Choosing the right approach",
      "Client-side_web_APIs": "Client-side web APIs",
      "Client-side_web_APIs_Introduction": "Introduction to web APIs",
      "Client-side_web_APIs_Manipulating_documents": "Manipulating documents",
      "Client-side_web_APIs_Fetching_data": "Fetching data from the server",
      "Client-side_web_APIs_Third_party_APIs": "Third party APIs",
      "Client-side_web_APIs_Drawing_graphics": "Drawing graphics",
      "Client-side_web_APIs_Video_and_audio_APIs": "Video and audio APIs",
      "Client-side_web_APIs_client-side_storage": "Client-side storage",
      Web_forms: "Web forms — Working with user data",
      Web_forms_core: "Core forms learning pathway",
      Web_forms_overview: "Web forms overview",
      Your_first_form: "Your first form",
      How_to_structure_a_web_form: "How to structure a web form",
      Basic_native_form_controls: "Basic native form controls",
      The_HTML5_input_types: "The HTML5 input types",
      Other_form_controls: "Other form controls",
      Styling_web_forms: "Styling web forms",
      Advanced_form_styling: "Advanced form styling",
      "UI_pseudo-classes": "UI pseudo-classes",
      "Client-side_form_validation": "Client-side form validation",
      Sending_form_data: "Sending form data",
      Web_forms_advanced: "Advanced forms articles",
      How_to_build_custom_form_controls: "How to build custom form controls",
      Sending_forms_through_JavaScript: "Sending forms through JavaScript",
      CSS_property_compatibility_table_for_form_controls:
        "CSS property compatibility table for form controls",
      "Accessibility_—_Make_the_web_usable_by_everyone":
        "Accessibility — Make the web usable by everyone",
      Accessibility_guides: "Accessibility guides",
      Accessibility_assessment: "Accessibility assessment",
      Accessibility_overview: "Accessibility overview",
      What_is_accessibility: "What is accessibility?",
      HTML_a_good_basis_for_accessibility:
        "HTML: A good basis for accessibility",
      CSS_and_JavaScript_accessibility_best_practices:
        "CSS and JavaScript accessibility best practices",
      "WAI-ARIA_basics": "WAI-ARIA basics",
      Accessible_multimedia: "Accessible multimedia",
      Mobile_accessibility: "Mobile accessibility",
      Assessment_Accessibility_troubleshooting:
        "Assessment: Accessibility troubleshooting",
      Tools_and_testing: "Tools and testing",
      Cross_browser_testing: "Cross browser testing",
      Cross_browser_testing_overview: "Cross browser testing overview",
      Introduction_to_cross_browser_testing:
        "Introduction to cross browser testing",
      Strategies_for_carrying_out_testing:
        "Strategies for carrying out testing",
      Handling_common_HTML_and_CSS_problems:
        "Handling common HTML and CSS problems",
      Handling_common_JavaScript_problems:
        "Handling common JavaScript problems",
      Handling_common_accessibility_problems:
        "Handling common accessibility problems",
      Implementing_feature_detection: "Implementing feature detection",
      Introduction_to_automated_testing: "Introduction to automated testing",
      Setting_up_your_own_test_automation_environment:
        "Setting up your own test automation environment",
      Git_and_GitHub: "Git and GitHub",
      Git_and_GitHub_overview: "Git and GitHub overview",
      "Client-side_web_development_tools": "Client-side web development tools",
      "Client-side_web_development_tools_index":
        "Client-side web development tools index",
      "Client-side_tooling_overview": "Client-side tooling overview",
      Command_line_crash_course: "Command line crash course",
      Package_management_basics: "Package management basics",
      Introducing_a_complete_toolchain: "Introducing a complete toolchain",
      Deploying_our_app: "Deploying our app",
      "Introduction_to_client-side_frameworks":
        "Introduction to client-side frameworks",
      "Client-side_frameworks_overview": "Client-side frameworks overview",
      Framework_main_features: "Framework main features",
      React: "React",
      Getting_started_with_React: "Getting started with React",
      Beginning_our_React_todo_list: "Beginning our React todo list",
      Componentizing_our_React_app: "Componentizing our React app",
      "React_interactivity:_Events_and_state":
        "React interactivity: Events and state",
      "React_interactivity:_Editing_filtering_conditional_rendering":
        "React interactivity: Editing, filtering, conditional rendering",
      Accessibility_in_React: "Accessibility in React",
      React_resources: "React resources",
      Ember: "Ember",
      Getting_started_with_Ember: "Getting started with Ember",
      Ember_app_structure_and_componentization:
        "Ember app structure and componentization",
      "Ember_interactivity:_Events_classes_and_state":
        "Ember interactivity: Events, classes and state",
      "Ember_Interactivity:_Footer_functionality_conditional_rendering":
        "Ember Interactivity: Footer functionality, conditional rendering",
      Routing_in_Ember: "Routing in Ember",
      Ember_resources_and_troubleshooting:
        "Ember resources and troubleshooting",
      Vue: "Vue",
      Getting_started_with_Vue: "Getting started with Vue",
      Creating_our_first_Vue_component: "Creating our first Vue component",
      Rendering_a_list_of_Vue_components: "Rendering a list of Vue components",
      "Adding_a_new_todo_form:_Vue_events_methods_and_models":
        "Adding a new todo form: Vue events, methods, and models",
      Styling_Vue_components_with_CSS: "Styling Vue components with CSS",
      Using_Vue_computed_properties: "Using Vue computed properties",
      "Vue_conditional_rendering:_editing_existing_todos":
        "Vue conditional rendering: editing existing todos",
      Focus_management_with_Vue_refs: "Focus management with Vue refs",
      Vue_resources: "Vue resources",
      Svelte: "Svelte",
      Getting_started_with_Svelte: "Getting started with Svelte",
      Starting_our_Svelte_Todo_list_app: "Starting our Svelte Todo list app",
      "Dynamic_behavior_in_Svelte:_working_with_variables_and_props":
        "Dynamic behavior in Svelte: working with variables and props",
      Componentizing_our_Svelte_app: "Componentizing our Svelte app",
      "Advanced_Svelte:_Reactivity_lifecycle_accessibility":
        "Advanced Svelte: Reactivity, lifecycle, accessibility",
      Working_with_Svelte_stores: "Working with Svelte stores",
      TypeScript_support_in_Svelte: "TypeScript support in Svelte",
      Deployment_and_next_steps: "Deployment and next steps",
      Angular: "Angular",
      Getting_started_with_Angular: "Getting started with Angular",
      Beginning_our_Angular_todo_list_app:
        "Beginning our Angular todo list app",
      Styling_our_Angular_app: "Styling our Angular app",
      Creating_an_item_component: "Creating an item component",
      "Filtering_our_to-do_items": "Filtering our to-do items",
      Building_Angular_applications_and_further_resources:
        "Building Angular applications and further resources",
      "Server-side_website_programming": "Server-side website programming",
      First_steps: "First steps",
      First_steps_overview: "First steps overview",
      "Introduction_to_the_server-side": "Introduction to the server-side",
      "Client-Server_overview": "Client-Server overview",
      "Server-side_web_frameworks": "Server-side web frameworks",
      Website_security: "Website security",
      "Django_web_framework_(Python)": "Django web framework (Python)",
      "Django_web_framework_(Python)_overview":
        "Django web framework (Python) overview",
      Django_introduction: "Introduction",
      Setting_up_a_development_environment:
        "Setting up a development environment",
      Tutorial_The_Local_Library_website: "Tutorial: The Local Library website",
      Tutorial_Part_2_Creating_a_skeleton_website:
        "Tutorial Part 2: Creating a skeleton website",
      Tutorial_Part_3_Using_models: "Tutorial Part 3: Using models",
      Tutorial_Part_4_Django_admin_site: "Tutorial Part 4: Django admin site",
      Tutorial_Part_5_Creating_our_home_page:
        "Tutorial Part 5: Creating our home page",
      Tutorial_Part_6_Generic_list_and_detail_views:
        "Tutorial Part 6: Generic list and detail views",
      Tutorial_Part_7_Sessions_framework: "Tutorial Part 7: Sessions framework",
      Tutorial_Part_8_User_authentication_and_permissions:
        "Tutorial Part 8: User authentication and permissions",
      Tutorial_Part_9_Working_with_forms: "Tutorial Part 9: Working with forms",
      Tutorial_Part_10_Testing_a_Django_web_application:
        "Tutorial Part 10: Testing a Django web application",
      Tutorial_Part_11_Deploying_Django_to_production:
        "Tutorial Part 11: Deploying Django to production",
      Web_application_security: "Web application security",
      Assessment_DIY_mini_blog: "Assessment: DIY mini blog",
      "Express_Web_Framework_(Node.js_JavaScript)":
        "Express Web Framework (node.js/JavaScript)",
      "Express_Web_Framework_(Node.js_JavaScript)_overview":
        "Express Web Framework (Node.js/JavaScript) overview",
      Express_Node_introduction: "Express/Node introduction",
      "Setting_up_a_Node_(Express)_development_environment":
        "Setting up a Node (Express) development environment",
      Express_Tutorial_The_Local_Library_website:
        "Express tutorial: The Local Library website",
      Express_Tutorial_Part_2_Creating_a_skeleton_website:
        "Express Tutorial Part 2: Creating a skeleton website",
      "Express_Tutorial_Part_3_Using_a_database_(with_Mongoose)":
        "Express Tutorial Part 3: Using a database (with Mongoose)",
      Express_Tutorial_Part_4_Routes_and_controllers:
        "Express Tutorial Part 4: Routes and controllers",
      Express_Tutorial_Part_5_Displaying_library_data:
        "Express Tutorial Part 5: Displaying library data",
      Express_Tutorial_Part_6_Working_with_forms:
        "Express Tutorial Part 6: Working with forms",
      Express_Tutorial_Part_7_Deploying_to_production:
        "Express Tutorial Part 7: Deploying to production",
      Further_resources: "Further resources",
      Common_questions: "Common questions",
      HTML_questions: "HTML questions",
      CSS_questions: "CSS questions",
      JavaScript_questions: "JavaScript questions",
      Web_mechanics: "Web mechanics",
      Tools_and_setup: "Tools and setup",
      Design_and_accessibility: "Design and accessibility",
    },
  };

  function getText(key) {
    const strings = text[locale] || text["en-US"];
    return strings[key] || text["en-US"][key];
  }

  const related = [];
  // "Complete beginners"
  related.push({
    title: getText("Complete_beginners"),
    slug: "Getting_started_with_the_web",
    content: [
      {
        title: getText("Getting_started_with_the_web"),
        content: [
          {
            title: getText("Getting_started_with_the_web_overview"),
            slug: "Getting_started_with_the_web",
          },
          {
            slug: "Getting_started_with_the_web/Installing_basic_software",
          },
          {
            slug: "Getting_started_with_the_web/What_will_your_website_look_like",
          },
          {
            slug: "Getting_started_with_the_web/Dealing_with_files",
          },
          {
            slug: "Getting_started_with_the_web/HTML_basics",
          },
          {
            slug: "Getting_started_with_the_web/CSS_basics",
          },
          {
            slug: "Getting_started_with_the_web/JavaScript_basics",
          },
          {
            slug: "Getting_started_with_the_web/Publishing_your_website",
          },
          {
            slug: "Getting_started_with_the_web/How_the_Web_works",
          },
        ],
      },
    ],
  });

  // "HTML - Structuring the web"
  related.push({
    title: getText("HTML_structuring_the_Web"),
    slug: "HTML",
    content: [
      {
        title: getText("Introduction_to_HTML"),
        content: [
          {
            title: getText("Introduction_to_HTML_overview"),
            slug: "HTML/Introduction_to_HTML",
          },
          {
            slug: "HTML/Introduction_to_HTML/Getting_started",
          },
          {
            slug: "HTML/Introduction_to_HTML/The_head_metadata_in_HTML",
          },
          {
            slug: "HTML/Introduction_to_HTML/HTML_text_fundamentals",
          },
          {
            slug: "HTML/Introduction_to_HTML/Creating_hyperlinks",
          },
          {
            slug: "HTML/Introduction_to_HTML/Advanced_text_formatting",
          },
          {
            slug: "HTML/Introduction_to_HTML/Document_and_website_structure",
          },
          {
            slug: "HTML/Introduction_to_HTML/Debugging_HTML",
          },
          {
            slug: "HTML/Introduction_to_HTML/Marking_up_a_letter",
          },
          {
            slug: "HTML/Introduction_to_HTML/Structuring_a_page_of_content",
          },
        ],
      },
      {
        title: getText("Multimedia_and_embedding"),
        content: [
          {
            title: getText("Multimedia_and_embedding_overview"),
            slug: "HTML/Multimedia_and_embedding",
          },
          {
            slug: "HTML/Multimedia_and_embedding/Images_in_HTML",
          },
          {
            slug: "HTML/Multimedia_and_embedding/Video_and_audio_content",
          },
          {
            slug: "HTML/Multimedia_and_embedding/Other_embedding_technologies",
          },
          {
            slug: "HTML/Multimedia_and_embedding/Adding_vector_graphics_to_the_Web",
          },
          {
            slug: "HTML/Multimedia_and_embedding/Responsive_images",
          },
          {
            slug: "HTML/Multimedia_and_embedding/Mozilla_splash_page",
          },
        ],
      },
      {
        title: getText("HTML_tables"),
        content: [
          {
            title: getText("HTML_tables_overview"),
            slug: "HTML/Tables",
          },
          {
            slug: "HTML/Tables/Basics",
          },
          {
            slug: "HTML/Tables/Advanced",
          },
          {
            slug: "HTML/Tables/Structuring_planet_data",
          },
        ],
      },
    ],
  });

  // "CSS - Styling the web"
  related.push({
    title: getText("CSS_styling_the_Web"),
    slug: "CSS",
    content: [
      {
        title: getText("CSS_first_steps"),
        content: [
          {
            title: getText("CSS_first_steps_overview"),
            slug: "CSS/First_steps",
          },
          {
            slug: "CSS/First_steps/What_is_CSS",
          },
          {
            slug: "CSS/First_steps/Getting_started",
          },
          {
            slug: "CSS/First_steps/How_CSS_is_structured",
          },
          {
            slug: "CSS/First_steps/How_CSS_works",
          },
          {
            slug: "CSS/First_steps/Using_your_new_knowledge",
          },
        ],
      },
      {
        title: getText("CSS_building_blocks"),
        content: [
          {
            title: getText("CSS_building_blocks_overview"),
            slug: "CSS/Building_blocks",
          },
          {
            slug: "CSS/Building_blocks/Cascade_and_inheritance",
          },
          {
            slug: "CSS/Building_blocks/Selectors",
          },
          {
            slug: "CSS/Building_blocks/The_box_model",
          },
          {
            slug: "CSS/Building_blocks/Backgrounds_and_borders",
          },
          {
            slug: "CSS/Building_blocks/Handling_different_text_directions",
          },
          {
            slug: "CSS/Building_blocks/Overflowing_content",
          },
          {
            slug: "CSS/Building_blocks/Values_and_units",
          },
          {
            slug: "CSS/Building_blocks/Sizing_items_in_CSS",
          },
          {
            slug: "CSS/Building_blocks/Images_media_form_elements",
          },
          {
            slug: "CSS/Building_blocks/Styling_tables",
          },
          {
            slug: "CSS/Building_blocks/Debugging_CSS",
          },
          {
            slug: "CSS/Building_blocks/Organizing",
          },
        ],
      },
      {
        title: getText("Styling_text"),
        content: [
          {
            title: getText("Styling_text_overview"),
            slug: "CSS/Styling_text",
          },
          {
            slug: "CSS/Styling_text/Fundamentals",
          },
          {
            slug: "CSS/Styling_text/Styling_lists",
          },
          {
            slug: "CSS/Styling_text/Styling_links",
          },
          {
            slug: "CSS/Styling_text/Web_fonts",
          },
          {
            slug: "CSS/Styling_text/Typesetting_a_homepage",
          },
        ],
      },
      {
        title: getText("CSS_layout"),
        content: [
          {
            title: getText("CSS_layout_overview"),
            slug: "CSS/CSS_layout",
          },
          {
            slug: "CSS/CSS_layout/Introduction",
          },
          {
            slug: "CSS/CSS_layout/Normal_Flow",
          },
          {
            slug: "CSS/CSS_layout/Flexbox",
          },
          {
            slug: "CSS/CSS_layout/Grids",
          },
          {
            slug: "CSS/CSS_layout/Floats",
          },
          {
            slug: "CSS/CSS_layout/Positioning",
          },
          {
            slug: "CSS/CSS_layout/Multiple-column_Layout",
          },
          {
            slug: "CSS/CSS_layout/Responsive_Design",
          },
          {
            slug: "CSS/CSS_layout/Media_queries",
          },
          {
            slug: "CSS/CSS_layout/Legacy_Layout_Methods",
          },
          {
            slug: "CSS/CSS_layout/Supporting_Older_Browsers",
          },
          {
            slug: "CSS/CSS_layout/Fundamental_Layout_Comprehension",
          },
        ],
      },
    ],
  });

  // "JavaScript — Dynamic client-side scripting"
  related.push({
    // title: getText("JavaScript_dynamic_client-side_scripting"),
    slug: "JavaScript",
    content: [
      {
        title: getText("JavaScript_first_steps"),
        content: [
          {
            title: getText("JavaScript_first_steps_overview"),
            slug: "JavaScript/First_steps",
          },
          {
            slug: "JavaScript/First_steps/What_is_JavaScript",
          },
          {
            slug: "JavaScript/First_steps/A_first_splash",
          },
          {
            slug: "JavaScript/First_steps/What_went_wrong",
          },
          {
            slug: "JavaScript/First_steps/Variables",
          },
          {
            slug: "JavaScript/First_steps/Math",
          },
          {
            slug: "JavaScript/First_steps/Strings",
          },
          {
            slug: "JavaScript/First_steps/Useful_string_methods",
          },
          {
            slug: "JavaScript/First_steps/Arrays",
          },
          {
            slug: "JavaScript/First_steps/Silly_story_generator",
          },
        ],
      },
      {
        title: getText("JavaScript_building_blocks"),
        content: [
          {
            title: getText("JavaScript_building_blocks_overview"),
            slug: "JavaScript/Building_blocks",
          },
          {
            slug: "JavaScript/Building_blocks/conditionals",
          },
          {
            slug: "JavaScript/Building_blocks/Looping_code",
          },
          {
            slug: "JavaScript/Building_blocks/Functions",
          },
          {
            slug: "JavaScript/Building_blocks/Build_your_own_function",
          },
          {
            slug: "JavaScript/Building_blocks/Return_values",
          },
          {
            slug: "JavaScript/Building_blocks/Events",
          },
          {
            slug: "JavaScript/Building_blocks/Image_gallery",
          },
        ],
      },
      {
        title: getText("Introducing_JavaScript_objects"),
        content: [
          {
            title: getText("Introducing_JavaScript_objects_overview"),
            slug: "JavaScript/Objects",
          },
          {
            slug: "JavaScript/Objects/Basics",
          },
          {
            slug: "JavaScript/Objects/Object-oriented_JS",
          },
          {
            slug: "JavaScript/Objects/Object_prototypes",
          },
          {
            slug: "JavaScript/Objects/Inheritance",
          },
          {
            slug: "JavaScript/Objects/JSON",
          },
          {
            slug: "JavaScript/Objects/Object_building_practice",
          },
          {
            slug: "JavaScript/Objects/Adding_bouncing_balls_features",
          },
        ],
      },
      {
        title: getText("Asynchronous_JavaScript"),
        content: [
          {
            title: getText("Asynchronous_JavaScript_overview"),
            slug: "JavaScript/Asynchronous",
          },
          {
            slug: "JavaScript/Asynchronous/Concepts",
          },
          {
            slug: "JavaScript/Asynchronous/Introducing",
          },
          {
            slug: "JavaScript/Asynchronous/Timeouts_and_intervals",
          },
          {
            slug: "JavaScript/Asynchronous/Promises",
          },
          {
            slug: "JavaScript/Asynchronous/Async_await",
          },
          {
            slug: "JavaScript/Asynchronous/Choosing_the_right_approach",
          },
        ],
      },
      {
        title: getText("Client-side_web_APIs"),
        content: [
          {
            slug: "JavaScript/Client-side_web_APIs",
          },
          {
            slug: "JavaScript/Client-side_web_APIs/Introduction",
          },
          {
            slug: "JavaScript/Client-side_web_APIs/Manipulating_documents",
          },
          {
            slug: "JavaScript/Client-side_web_APIs/Fetching_data",
          },
          {
            slug: "JavaScript/Client-side_web_APIs/Third_party_APIs",
          },
          {
            slug: "JavaScript/Client-side_web_APIs/Drawing_graphics",
          },
          {
            slug: "JavaScript/Client-side_web_APIs/Video_and_audio_APIs",
          },
          {
            slug: "JavaScript/Client-side_web_APIs/Client-side_storage",
          },
        ],
      },
    ],
  });

  // "Web forms — Working with user data"
  related.push({
    slug: "Forms",
    content: [
      {
        title: getText("JavaScript_first_steps"),
        content: [
          {
            title: getText("Web_forms_overview"),
            slug: "Forms",
          },
          {
            slug: "Forms/Your_first_form",
          },
          {
            slug: "Forms/How_to_structure_a_web_form",
          },
          {
            slug: "Forms/Basic_native_form_controls",
          },
          {
            slug: "Forms/HTML5_input_types",
          },
          {
            slug: "Forms/Other_form_controls",
          },
          {
            slug: "Forms/Styling_web_forms",
          },
          {
            slug: "Forms/Advanced_form_styling",
          },
          {
            slug: "Forms/UI_pseudo-classes",
          },
          {
            slug: "Forms/Form_validation",
          },
          {
            slug: "Forms/Sending_and_retrieving_form_data",
          },
        ],
      },
      {
        title: getText("Web_forms_advanced"),
        content: [
          {
            slug: "Forms/How_to_build_custom_form_controls",
          },
          {
            slug: "Forms/Sending_forms_through_JavaScript",
          },
          {
            slug: "Forms/Property_compatibility_table_for_form_controls",
          },
        ],
      },
    ],
  });

  // Accessibility — Make the web usable by everyone
  related.push({
    title: getText("Accessibility_—_Make_the_web_usable_by_everyone"),
    slug: "Accessibility",
    content: [
      {
        title: getText("JavaScript_first_steps"),
        content: [
          {
            title: getText("Accessibility_overview"),
            slug: "Accessibility",
          },
          {
            slug: "Accessibility/What_is_accessibility",
          },
          {
            slug: "Accessibility/HTML",
          },
          {
            slug: "Accessibility/CSS_and_JavaScript",
          },
          {
            slug: "Accessibility/WAI-ARIA_basics",
          },
          {
            slug: "Accessibility/Multimedia",
          },
          {
            slug: "Accessibility/Mobile",
          },
        ],
      },
      {
        title: getText("Accessibility_assessment"),
        content: [
          {
            // title: getText("Assessment_Accessibility_troubleshooting"),
            slug: "Accessibility/Accessibility_troubleshooting",
          },
        ],
      },
    ],
  });

  // Tools and testing
  related.push({
    slug: "Tools_and_testing",
    content: [
      {
        title: getText("Client-side_web_development_tools"),
        content: [
          {
            title: getText("Client-side_web_development_tools_index"),
            slug: "Tools_and_testing/Understanding_client-side_tools",
          },
          {
            slug: "Tools_and_testing/Understanding_client-side_tools/Overview",
          },
          {
            slug: "Tools_and_testing/Understanding_client-side_tools/Command_line",
          },
          {
            slug: "Tools_and_testing/Understanding_client-side_tools/Package_management",
          },
          {
            slug: "Tools_and_testing/Understanding_client-side_tools/Introducing_complete_toolchain",
          },
          {
            slug: "Tools_and_testing/Understanding_client-side_tools/Deployment",
          },
        ],
      },
      {
        title: getText("Introduction_to_client-side_frameworks"),
        content: [
          {
            title: getText("Client-side_frameworks_overview"),
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Introduction",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Main_features",
          },
        ],
      },
      {
        title: getText("React"),
        content: [
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/React_todo_list_beginning",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/React_components",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/React_interactivity_events_state",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/React_interactivity_filtering_conditional_rendering",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/React_accessibility",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/React_resources",
          },
        ],
      },
      {
        title: getText("Ember"),
        content: [
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Ember_getting_started",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Ember_structure_componentization",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Ember_interactivity_events_state",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Ember_conditional_footer",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Ember_routing",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Ember_resources",
          },
        ],
      },
      {
        title: getText("Vue"),
        content: [
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_getting_started",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_first_component",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_rendering_lists",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_methods_events_models",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_styling",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_computed_properties",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_conditional_rendering",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_refs_focus_management",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Vue_resources",
          },
        ],
      },
      {
        title: getText("Svelte"),
        content: [
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_getting_started",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_Todo_list_beginning",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_variables_props",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_components",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_reactivity_lifecycle_accessibility",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_stores",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_TypeScript",
          },
          {
            slug: "Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_deployment_next",
          },
        ],
      },
      {
        title: getText("Git_and_GitHub"),
        content: [
          {
            title: getText("Git_and_GitHub_overview"),
            slug: "Tools_and_testing/GitHub",
          },
          {
            title: "Hello World",
            url: "https://guides.github.com/activities/hello-world/",
          },
          {
            title: "Git Handbook",
            url: "https://guides.github.com/introduction/git-handbook/",
          },
          {
            title: "Forking Projects",
            url: "https://guides.github.com/activities/forking/",
          },
          {
            title: "About pull requests",
            url: "https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests",
          },
          {
            title: "Mastering Issues",
            url: "https://guides.github.com/features/issues/",
          },
        ],
      },
      {
        title: getText("Cross_browser_testing"),
        content: [
          {
            title: getText("Cross_browser_testing_overview"),
            slug: "Tools_and_testing/Cross_browser_testing",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/Introduction",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/Testing_strategies",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/HTML_and_CSS",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/JavaScript",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/Accessibility",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/Feature_detection",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/Automated_testing",
          },
          {
            slug: "Tools_and_testing/Cross_browser_testing/Your_own_automation_environment",
          },
        ],
      },
    ],
  });

  // Server-side website programming
  related.push({
    slug: "Server-side",
    content: [
      {
        title: getText("First_steps"),
        content: [
          {
            title: getText("First_steps_overview"),
            slug: "Server-side/First_steps",
          },
          {
            slug: "Server-side/First_steps/Introduction",
          },
          {
            slug: "Server-side/First_steps/Client-Server_overview",
          },
          {
            slug: "Server-side/First_steps/Web_frameworks",
          },
          {
            slug: "Server-side/First_steps/Website_security",
          },
        ],
      },
      {
        title: getText("Django_web_framework_(Python)"),
        content: [
          {
            title: getText("Django_web_framework_(Python)_overview"),
            slug: "Server-side/Django",
          },
          {
            slug: "Server-side/Django/Introduction",
          },
          {
            slug: "Server-side/Django/development_environment",
          },
          {
            slug: "Server-side/Django/Tutorial_local_library_website",
          },
          {
            slug: "Server-side/Django/skeleton_website",
          },
          {
            slug: "Server-side/Django/Models",
          },
          {
            slug: "Server-side/Django/Admin_site",
          },
          {
            slug: "Server-side/Django/Home_page",
          },
          {
            slug: "Server-side/Django/Generic_views",
          },
          {
            slug: "Server-side/Django/Sessions",
          },
          {
            slug: "Server-side/Django/Authentication",
          },
          {
            slug: "Server-side/Django/Forms",
          },
          {
            slug: "Server-side/Django/Testing",
          },
          {
            slug: "Server-side/Django/Deployment",
          },
          {
            slug: "Server-side/Django/web_application_security",
          },
          {
            slug: "Server-side/Django/django_assessment_blog",
          },
        ],
      },
      {
        title: getText("Express_Web_Framework_(Node.js_JavaScript)"),
        content: [
          {
            title: getText(
              "Express_Web_Framework_(Node.js_JavaScript)_overview"
            ),
            slug: "Server-side/Express_Nodejs",
          },
          {
            slug: "Server-side/Express_Nodejs/Introduction",
          },
          {
            slug: "Server-side/Express_Nodejs/development_environment",
          },
          {
            slug: "Server-side/Express_Nodejs/Tutorial_local_library_website",
          },
          {
            slug: "Server-side/Express_Nodejs/skeleton_website",
          },
          {
            slug: "Server-side/Express_Nodejs/mongoose",
          },
          {
            slug: "Server-side/Express_Nodejs/routes",
          },
          {
            slug: "Server-side/Express_Nodejs/Displaying_data",
          },
          {
            slug: "Server-side/Express_Nodejs/forms",
          },
          {
            slug: "Server-side/Express_Nodejs/deployment",
          },
        ],
      },
    ],
  });

  // Further resources
  related.push({
    title: getText("Further_resources"),
    content: [
      {
        title: getText("Common_questions"),
        content: [
          {
            title: getText("HTML_questions"),
            slug: "HTML/Howto",
          },
          {
            title: getText("CSS_questions"),
            slug: "CSS/Howto",
          },
          {
            title: getText("JavaScript_questions"),
            slug: "JavaScript/Howto",
          },
          {
            title: getText("Web_mechanics"),
            slug: "Common_questions#Web_mechanics",
          },
          {
            title: getText("Tools_and_setup"),
            slug: "Common_questions#Tools_and_setup",
          },
          {
            title: getText("Design_and_accessibility"),
            slug: "Common_questions#Design_and_accessibility",
          },
        ],
      },
    ],
  });

  setURLFromSlug(related, baseURL);
  setTitleFromURL(related, locale);

  return related;
};

const _cache = new Map();

function getRelatedContent(doc) {
  const { locale, mdn_url } = doc;
  // First get it purely dependent on the locale
  if (!_cache.has(locale)) {
    _cache.set(locale, getRelatedByLocale(locale));
  }
  const related = clonedeep(_cache.get(locale));

  // Now we can inject which page we're currently on based on the doc.
  setActive(related, mdn_url);
  return related;
}
module.exports = getRelatedContent;
