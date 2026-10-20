import ResourcePage from "./ResourcePage";
import { resourceConfigs } from "./resourceConfigs";

export default function AppointmentsPage() {
  return <ResourcePage config={resourceConfigs.appointments} />;
}
