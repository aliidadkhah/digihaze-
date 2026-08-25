import OrderSuccessClient from "./OrderSuccessClient";

export default async function OrderSuccessPage({
  searchParams,
}) {
  const params =
    await searchParams;

  const orderId =
    params?.id || "";

  return (
    <OrderSuccessClient
      orderId={orderId}
    />
  );
}
