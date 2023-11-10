# ACL
## TODOs
- Remove `/* eslint-disable import/no-unused-modules */` when tools are actually being used..
The ACL container dramatically simplifies the logic for when features are shown
or hidden, loaded or not loaded. It does this by moving all variables and logic
into a centralised map of "features". Each feature has a function which has one
parameter called "context".
The ACL context contains all the variables that are required to determine if
someone has access to this feature or not. All the function should do is returning
true if "yes" or false if "no".
## Definitions
- ACL is the general Access Control List definition. Its simply a mechanism to determine
  if someone has access to something
- ACL Context is the information that is used to determine access
- Conditions are rules that use ACL Context info in a certain way to check access
- Features are "application features" as perceived from the outside non-technical perspective
  This could mean that there are multiple "features" (like cases and VAS) using exactly the same rule or one feature
  using multiple conditions (like isLoggedIn, isAdmin, etc) to determine access.
## Usage
Now either use the `useIsAllowed` hook like this:
```tsx
const MyComponent = () => {
  const isAllowed = useIsAllowed('myFeature')
  if (!isAllowed) {
    return null
  }
  return <div>YEEY</div>
}
```
### Preferred usage - HOCs + Container components pattern
```tsx
const MyContainerComponent = () => (
  <div>YEEY</div>
)
export const MyContainer = withAcl(MyContainerComponent)
```
The above will make the actual component "unaware" of the ACL library and allowes
reusing container components for multiple features like below:
```tsx
const MyPage = () => (
  <main>
    <ProductList feature="previouslyBought" filters={{ previouslyBought: true }} />
    <ProductList feature="products" />
  </main>
)
```
### Usage in useEffects or other non-reactive functions:
```tsx
const MyComponent = () => {
  const hasAccess = useAcl()
  useEffect(() => {
    if (hasAccess('myFeature')) {
      // Apply effect if has access
    }
  })
}
```
## Proposals
### Service level toggles from Launch Darkly
Instead of having separate feature flags for very specific implementations, the proposal is
to have 2 feature flags.
1. `services`. This flag will indicate which services will be visible and accessible
  in the app. Its value would be an object as described below.
```ts
type AccessLevel = 'all' | 'developer' | 'none'
const serviceFlags = {
    cases: 'developer',
    vas: 'developer',
    checkout: 'all',
    products: 'all',
    order: 'all',
    samples: 'developer'
}
```
The above object's keys represent service slugs which we can refer to from the app as "feature".
This way we can easily switch off services depending on who is loading the app. The values
represent the access level. Every internal Brenntag employee that works on the application
can be considered a `developer` (QA, BA, Designers, Product Owners, Backend, Frontend, Salesforce),
so in this case it means that developers can also see cases, vas (Value Added Services) and samples
while normal users can just see the checkout, products and orders.
Value `none` essentially means "feature off in that environment".
### [WIP] Feature level toggles from Launch Darkly
```ts
type AccessLevel = 'all' | 'developer' | 'none'
const featureFlags = {
    checkoutButton: 'all',
}
```
## Install (only in new projects)
In your root component (App.tsx usually) ensure that it's a child of any context provider that
the AclProvider would need info from:
```tsx
export const App = () => (
  <AuthProvider>
    <LaunchDarklyProvider>
      <ProductsProvider>
        <CartProvider>
          <AclProvider>
            <Router />
          </AclProvider>
        </CartProvider>
      </ProductsProvider>
    </LaunchDarklyProvider>
  </AuthProvider>
)
```
## Deep dive on how ACL works with features:
### How its done without proper ACL and feature functionaliy
Consider the below component with a 'yet' relatively simple scenario
```tsx
const MyComponent = () => {
  const user = useUser()
  const featureToggle = useFeatureToggles()
  const canSee = usePermissions(user.id)
  const abTest = useAbTest()
  if (user.isLoggedIn && abTest['my-feature'] === '1' && canSee('my-feature')) {
    return (
      <div>YEEY</div>
    )
  }
  return null
}
```
Worse. In most cases this logic is done on page level, making the page tightly
coupled with any feature that requires app state to check if it needs to be loaded.
Pages themselves can even be considered features too or at the very least require
access control to check login state or feature flags.
### How it's done using this library
Now consider this using the ACL container:
```tsx
const MyContainerComponent = () => {
  return <div>YEEY</div>
}
export const MyContainer = withAcl(MyContainerComponent)
```
And its usage:
```tsx
const MyPage = () => (
  <main>
    <MyContainer feature="my-feature" />
  </main>
)
```
As you can see, the logic that determines if a feature needs to be shown is completely
decoupled from the component and to make it better, you now also have a clear view on
what features are on a specific page while also having a centralised "library" of features
and when they will be shown. See below:
```tsx
export const featureAccessMap: Record<string, AclFunc> = {
  productList: (context) => {
    return context.isLoggedIn
  },
  checkout: (context) => {
    // Using an ACL helper to interpret permissions based on info from the auth provider
    return context.isLoggedIn && can(context.user).access('checkout')
  },
  cases: (context) => {
    // Feature toggles coming from Launch Darkly
    // In this case the "access" method might be a function that checks
    // if there is a flag that would limit access to "cases"
    return can(context.user).access('cases')
  },
  vas: (context) => {
    // In this case the "access" method might be a function that checks
    // if there is a flag that would limit access to "Value Added Services"
    // context.flags is injected into the ACL context using the useFlags hook.
    const salesGroupToggles = getFlag(context.flags, 'enableCasesAndVasCreation')
    // This is the 'actual' function as committed by the cases FE team
    return isUserInSalesGroups(context.user, salesGroupToggles)
  },
  devTools: (context) => {
    // Relying on build time variables also removes any feature that
    // would result in false from the code
    return Boolean(context.isDevMode || context.devTools) && context.environment !== 'production'
  }
}
```
So let's do a deep dive into this context and `isUserInSalesGroups` function:
```ts
const isUserInSalesGroups = (
  user: User,
  salesGroupNames: Record<string, boolean>,
): boolean => {
  const matchedCustomer = user.customers.find(customer => {
    return salesGroupNames[customer.salesGroup.shortName]
  })
  return Boolean(matchedCustomer)
}
```
