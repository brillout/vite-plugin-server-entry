export { hasDefinedProp }

type NonUndefined<T> = T extends undefined ? never : T

function hasDefinedProp<ObjectType extends Record<string, unknown>, PropName extends PropertyKey>(
  obj: ObjectType,
  prop: PropName
): obj is ObjectType & Record<PropName, Record<string, NonUndefined<unknown>>> {
  const propExists = typeof obj === 'object' && obj !== null && prop in obj
  if (!propExists) {
    return false
  }
  const propValue = (obj as Record<any, unknown>)[prop]
  return propValue !== undefined
}
