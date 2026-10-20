import ResourcePage from "./ResourcePage";
import { resourceConfigs } from "./resourceConfigs";

export default function ServicesPage() {
  return <ResourcePage config={resourceConfigs.services} />;
}
