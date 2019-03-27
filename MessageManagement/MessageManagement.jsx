import React from "react";
import { Route } from "react-router-dom";
import Loadable from "react-loadable";
import MyLoadingComponent from "~/components/common/loadComponents";

const routes = [
    {
        path: "BroadcastMessage",
        component: Loadable({
            loader: () =>
                import("~/container/MessageManagement/BroadcastMessage/BroadcastMessage"),
            loading: MyLoadingComponent
        }),
        isExact: true
    },
    {
        path: "MessagePublish",
        component: Loadable({
            loader: () =>
                import("~/container/MessageManagement/MessagePublish/MessagePublish"),
            loading: MyLoadingComponent
        }),
        isExact: true
    },
    {
        path: "MessageRecord",
        component: Loadable({
            loader: () =>
                import("~/container/MessageManagement/MessageRecord/MessageRecord"),
            loading: MyLoadingComponent
        }),
        isExact: true
    }
];
class MessageManagement extends React.Component {
    render() {
        const RouteWithSubRoutes = route => (
            <Route
                exact={route.isExact}
                path={`${match.url}/${route.path}`}
                render={props => <route.component {...props} routes={route.routes} />}
            />
        );
        const { match } = this.props;
        return (
            <div>
                <div className="system-container">
                    <div>
                        {routes.map((route, i) => (
                            <RouteWithSubRoutes key={i} {...route} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default MessageManagement;
