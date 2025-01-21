const errorResponse = (message: string) => {
  return { status: 'error', message };
};
/** Success Response Function
 *
 * @param message -   Success Response Message
 * @param data    -   Success Response Data
 */
const successResponse = (message: string) => {
  return { status: 'success', message };
};
export { errorResponse, successResponse };
