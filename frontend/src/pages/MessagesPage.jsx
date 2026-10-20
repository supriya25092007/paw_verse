import ResourcePage from "./ResourcePage";
import { resourceConfigs } from "./resourceConfigs";

export default function MessagesPage() {
  return <ResourcePage config={resourceConfigs.messages} />;
}
