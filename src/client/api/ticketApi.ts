export const fetchTickets = async () => {
  const res = await fetch('/api/tickets');
  if (!res.ok) throw new Error('Failed to fetch tickets')
  return res.json()
}
