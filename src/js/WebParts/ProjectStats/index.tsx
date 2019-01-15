import * as React from "react";
import __ from "../../Resources";
import { SortAlphabetically } from "../../Util";
import * as DynamicPortfolioConfiguration from "../DynamicPortfolio/DynamicPortfolioConfiguration";
import IDynamicPortfolioViewConfig from "../DynamicPortfolio/DynamicPortfolioConfiguration/IDynamicPortfolioViewConfig";
import { sp } from "@pnp/sp";
import { LogLevel, Logger } from "@pnp/logging";
import { Spinner, SpinnerType } from "office-ui-fabric-react/lib/Spinner";
import { MessageBar, MessageBarType } from "office-ui-fabric-react/lib/MessageBar";
import IProjectStatsProps, { ProjectStatsDefaultProps } from "./IProjectStatsProps";
import IProjectStatsState from "./IProjectStatsState";
import Project from "./Project";
import ChartConfiguration from "./ChartConfiguration";
import StatsFieldConfiguration from "./StatsFieldConfiguration";
import { IContentType } from "../../Model";
import ProjectStatsChart, { ProjectStatsChartData } from "./ProjectStatsChart";
import ProjectStatsDataSelection from "./ProjectStatsDataSelection";
import BaseWebPart from "../@BaseWebPart";
import Preferences from "../../Preferences";
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar";
import { ContextualMenuItemType, IContextualMenuItem } from "office-ui-fabric-react/lib/ContextualMenu";
import { autobind } from "office-ui-fabric-react/lib/Utilities";

const LOG_TEMPLATE = "(ProjectStats) {0}: {1}";

/**
 * ProjectStats
 */
export default class ProjectStats extends BaseWebPart<IProjectStatsProps, IProjectStatsState> {
    public static displayName = "ProjectStats";
    public static defaultProps = ProjectStatsDefaultProps;

    /**
     * Constructor
     *
     * @param {IProjectStatsProps} props Props
     */
    constructor(props: IProjectStatsProps) {
        super(props, { isLoading: true, showChartSettings: props.showChartSettings });
    }

    public async componentDidMount() {
        try {
            const config = await this.fetchData();
            Logger.log({
                message: String.format(LOG_TEMPLATE, "componentDidMount", `Successfully fetched chart config for ${config.charts.length} charts.`),
                level: LogLevel.Info,
            });
            this.setState({
                ...config,
                isLoading: false,
            });
        } catch (err) {
            console.log(err);
            Logger.log({
                message: String.format(LOG_TEMPLATE, "componentDidMount", "Failed to fetch data."),
                data: err,
                level: LogLevel.Error,
            });
            this.setState({ errorMessage: err, isLoading: false });
        }
    }

    /**
     * Renders the <ProjectStats /> component
     */
    public render(): React.ReactElement<IProjectStatsProps> {
        const { isLoading, errorMessage, data } = this.state;
        if (isLoading) {
            return <Spinner label={__.getResource("String_ProjectStats_Loading_Text")} type={SpinnerType.large} />;
        }
        if (errorMessage) {
            return <MessageBar messageBarType={MessageBarType.error}>{__.getResource("String_ProjectStats_Error_Text")}</MessageBar>;
        }
        Logger.log({ message: String.format(LOG_TEMPLATE, "render", "Rendering component <ProjectStats />."), level: LogLevel.Info });
        return (
            <div className="ms-Grid">
                <div className="ms-Grid-row">
                    {this.renderCommandBar()}
                </div>
                <div className="ms-Grid-row">
                    {this.renderInner()}
                </div>
                {this.state.showDataSelectionModal && (
                    <ProjectStatsDataSelection
                        data={data}
                        onUpdateSelection={this.onDataSelectionUpdated}
                        onDismiss={_ => this.setState({ showDataSelectionModal: false })} />
                )}
            </div>
        );
    }

    /**
    * Renders the command bar from office-ui-fabric-react
    */
    private renderCommandBar() {
        const items: IContextualMenuItem[] = [];
        const farItems: IContextualMenuItem[] = [];

        items.push({
            key: "NewItem",
            name: __.getResource("String_New"),
            iconProps: { iconName: "Add" },
            itemType: ContextualMenuItemType.Header,
            onClick: e => e.preventDefault(),
            subMenuProps: {
                items: this.state.contentTypes.map(({ Name, StringId, NewFormUrl }) => ({
                    key: `ContentType_${StringId}`,
                    name: Name,
                    onClick: (e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        let contentTypeNewFormUrl = `${NewFormUrl}?ContentTypeId=${StringId}&Source=${encodeURIComponent(_spPageContextInfo.serverRequestPath)}`;
                        document.location.href = contentTypeNewFormUrl;
                    },
                })),
            },
        });

        farItems.push({
            key: "ShowChartSettings",
            name: __.getResource("String_ProjectStats_ShowChartSettings_Text"),
            iconProps: { iconName: "ContactCardSettings" },
            checked: this.state.showChartSettings,
            canCheck: true,
            onClick: (e: any) => {
                e.preventDefault();
                this.setState({ showChartSettings: !this.state.showChartSettings });
            },
        });

        farItems.push({
            key: "EditDataSelection",
            name: __.getResource("String_ProjectStats_EditDataSelection_Text"),
            iconProps: { iconName: "ExploreData" },
            onClick: (e: any) => {
                e.preventDefault();
                this.setState({ showDataSelectionModal: true });
            },
        });

        if (this.props.viewSelectorEnabled) {
            farItems.push({
                key: "View",
                name: this.state.currentView.name,
                iconProps: { iconName: "List" },
                itemType: ContextualMenuItemType.Header,
                onClick: e => e.preventDefault(),
                subMenuProps: {
                    items: this.state.views.map((qc, idx) => ({
                        key: `View_${idx.toString()}`,
                        name: qc.name,
                        iconProps: { iconName: qc.iconName },
                        onClick: (e: any) => {
                            e.preventDefault();
                            this.onViewChanged(qc);
                        },
                    })),
                },
            });
        }

        return (
            <div className="ms-Grid-col ms-sm12">
                <CommandBar items={items} farItems={farItems} />
            </div>
        );
    }

    /**
     * Render inner
     */
    private renderInner() {
        const { charts, data } = this.state;
        if (charts.length === 0) {
            return <MessageBar messageBarType={MessageBarType.info}>{__.getResource("String_ProjectStats_No_Charts_Text")}</MessageBar>;
        }
        if (data.getCount() === 0) {
            return <MessageBar messageBarType={MessageBarType.info}>{__.getResource("String_ProjectStats_No_Data_Text")}</MessageBar>;
        }
        return charts
            .sort((a, b) => a.order - b.order)
            .map((c, i) => (
                <ProjectStatsChart
                    key={i}
                    chart={c}
                    showSettings={this.state.showChartSettings} />
            ));
    }

    /**
     * On data selection updated
     *
     * @param {ProjectStatsChartData} data Data
     */
    @autobind
    private async onDataSelectionUpdated(data: ProjectStatsChartData): Promise<void> {
        Logger.log({
            message: String.format(LOG_TEMPLATE, "_onDataSelectionUpdated", "Selection was updated."), level: LogLevel.Info,
        });
        this.setState({ showDataSelectionModal: false, charts: this.state.charts.map(c => c.initOrUpdate(data)) });
    }

    /**
     * On view changed
     *
     * @param {IDynamicPortfolioViewConfig} view View
     */
    @autobind
    private async onViewChanged(view: IDynamicPortfolioViewConfig): Promise<void> {
        Logger.log({ message: String.format(LOG_TEMPLATE, "_onViewChanged", "View was updated."), data: { view }, level: LogLevel.Info });
        this.setState({ isLoading: true });
        try {
            const { data } = await this.fetchData(view);
            this.setState({
                isLoading: false,
                currentView: view,
                data,
                charts: this.state.charts.map(c => c.initOrUpdate(data)),
            });
        } catch (errorMessage) {
            Logger.log({
                message: String.format(LOG_TEMPLATE, "_onViewChanged", "Failed to fetch data."),
                data: errorMessage,
                level: LogLevel.Error,
            });
            this.setState({ errorMessage, isLoading: false });
        }
    }

    /**
     * Fetch data
     *
     * @param {IDynamicPortfolioViewConfig} view View
     */
    private async fetchData(view?: IDynamicPortfolioViewConfig): Promise<Partial<IProjectStatsState>> {
        const fieldPrefix = Preferences.getParameter("ProjectStatsFieldPrefix");
        const statsFieldsList = sp.web.lists.getByTitle(__.getResource("Lists_StatsFieldsConfig_Title"));
        const chartsConfigList = sp.web.lists.getByTitle(__.getResource("Lists_ChartsConfig_Title"));
        try {
            const [{ views }, fieldsSpItems, chartsSpItems, chartsConfigListContentTypes, statsFieldsListContenTypes] = await Promise.all([
                DynamicPortfolioConfiguration.getConfig(),
                statsFieldsList.items.select("ID", "Title", `${fieldPrefix}ManagedPropertyName`, `${fieldPrefix}DataType`).usingCaching().get(),
                chartsConfigList.items.usingCaching().get(),
                chartsConfigList.contentTypes.usingCaching().get(),
                statsFieldsList.contentTypes.usingCaching().get(),
            ]);
            const contentTypes: IContentType[] = [...chartsConfigListContentTypes, ...statsFieldsListContenTypes];
            if (!view) {
                [view] = views.filter(v => v.default);
                if (!view) {
                    view = views[0];
                    Logger.log({
                        message: String.format(LOG_TEMPLATE, "fetchData", `No default view found. Using ${view.name}.`),
                        level: LogLevel.Info,
                    });
                }
            }
            Logger.log({
                message: String.format(LOG_TEMPLATE, "fetchData", `Fetching view ${view.name}.`),
                data: { queryTemplate: view.queryTemplate },
                level: LogLevel.Info,
            });

            const fields = fieldsSpItems.map(i => new StatsFieldConfiguration(i.ID, i.Title, i[`${fieldPrefix}ManagedPropertyName`], i[`${fieldPrefix}DataType`]));
            const response = await sp.search({
                Querytext: "*",
                QueryTemplate: view.queryTemplate,
                RowLimit: 500,
                TrimDuplicates: false,
                SelectProperties: ["Title", "Path", ...fields.map(f => f.managedPropertyName)],
            });
            const items = response.PrimarySearchResults
                .map(searchRes => new Project(searchRes))
                .sort((a, b) => SortAlphabetically(a, b, "name"));
            const data = new ProjectStatsChartData(items);
            const charts = chartsSpItems.map(spItem => {
                let chartFields = fields.filter(f => spItem[`${fieldPrefix}FieldsId`].results.indexOf(f.id) !== -1);
                return new ChartConfiguration(spItem, chartsConfigList, chartsConfigListContentTypes).initOrUpdate(data, chartFields);
            });
            const config: Partial<IProjectStatsState> = {
                charts,
                data,
                views,
                contentTypes,
                currentView: view,
            };
            return config;
        } catch (err) {
            throw err;
        }
    }
}

export { IProjectStatsProps, IProjectStatsState };
