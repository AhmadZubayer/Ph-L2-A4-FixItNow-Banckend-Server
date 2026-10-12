# Category service methods

Source: [category.service.ts](../src/modules/category/category.service.ts)

## Methods and their purpose

- **`createCategoryIntoDB`** — Creates a category after checking its name and slug.
- **`getAllCategoriesFromDB`** — Lists active categories for public visitors.
- **`getAllCategoriesForAdminFromDB`** — Lists all categories for an admin, including inactive ones.

## Method flows

### 1. `createCategoryIntoDB` — **CRITICAL: duplicate check**

1. **Start:** An admin calls `POST /api/admin/categories`. Authentication checks the admin role, validation checks the body, and the category controller passes the body here.
2. Find a category whose name **or** slug matches the requested values.
3. If one exists, stop with “Category name or slug already exists.”
4. If none exists, create a category using the validated request data.
5. Return the new category to the controller, which sends the response.

### 2. `getAllCategoriesFromDB`

1. **Start:** A visitor calls `GET /api/categories`. The category controller calls this method with no input.
2. Find categories where `isActive` is `true`.
3. Sort them by name from A to Z.
4. Return the list to the controller. Inactive categories do not appear in this public list.

### 3. `getAllCategoriesForAdminFromDB`

1. **Start:** An admin calls `GET /api/admin/categories`. Authentication checks the admin role, and the controller calls this method.
2. Find **all** categories, including inactive ones.
3. Sort them by name from A to Z.
4. Return the list to the controller.
