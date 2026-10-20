import ResourcePage from "./ResourcePage";
import { resourceConfigs } from "./resourceConfigs";

export default function TransactionsPage() {
  return <ResourcePage config={resourceConfigs.transactions} />;
}
